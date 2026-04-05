import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getRankedPlayers, calculateClutchScore, assignTier } from "../utils/fantasyEngine";
import "../styles/PlayerDetail.css";
import "../styles/Charts.css";
import SeasonStatsTable from "../components/SeasonStatsTable";
import GameLogsTable from "../components/GameLogsTable";
import PlayerRadarChart from "../components/PlayerRadarChart";
import FantasyPointsTrendChart from "../components/ClutchScoreTrend";
import ScoringBreakdownChart from "../components/ScoringBreakdownChart";
import RecentFormChart from "../components/RecentFormChart";

const TIER_GRADIENTS = {
  "Elite Start":  "linear-gradient(to top, rgba(245,158,11,0.25) 0%, #fff 35%)",
  "Strong Start": "linear-gradient(to top, rgba(142,68,173,0.25) 0%, #fff 35%)",
  "Flex Play":    "linear-gradient(to top, rgba(52,152,219,0.25) 0%, #fff 35%)",
  "Bench":        "linear-gradient(to top, rgba(103,107,110,0.25) 0%, #fff 35%)",
};

const TIER_COLORS = {
  "Elite Start":  "rgba(245,158,11,1)",
  "Strong Start": "rgba(142,68,173,1)",
  "Flex Play":    "rgba(52,152,219,1)",
  "Bench":        "rgb(103,107,110)",
};

const TIER_BADGE_GRADIENTS = {
  "Elite Start":  "linear-gradient(135deg, #f59e0b, #d97706)",
  "Strong Start": "linear-gradient(135deg, #8e44ad, #6c3483)",
  "Flex Play":    "linear-gradient(135deg, #3498db, #2176ae)",
  "Bench":        "linear-gradient(135deg, #6b7280, #4b5563)",
};

const TIER_ICONS = {
  "Elite Start": "👑",
  "Strong Start": "⚡",
  "Flex Play":   "🔀",
  "Bench":       "🪑",
};

function getPlayerTier(p) {
  return assignTier(Math.round(calculateClutchScore(p)));
}

const SKEL_COLS = [72, 58, 32, 28, 46, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36];
const SKEL_ROWS = 7;

function SkelCell({ width }) {
  return (
    <td>
      <div className="skel skel-cell" style={{ width }} />
    </td>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="player-detail-page">
      <div className="player-detail-nav">
        <Navbar
          searchTerm=""
          onSearchChange={() => {}}
          searchResults={[]}
          onSelectPlayer={() => {}}
        />
      </div>

      <div className="skeleton-banner">
        <div className="skeleton-banner-content">

          <div className="skel skel-headshot">
            <svg
              className="skel-headshot-figure"
              viewBox="0 0 24 24"
              fill="#999"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>

          <div className="skeleton-identity">
            <div className="skel skel-status" />
            <div className="skel skel-firstname" />
            <div className="skel skel-lastname" />
            <div className="skel skel-badge" />
            <div className="skel skel-meta" />
          </div>

          <div className="banner-spacer" />
          <div className="skeleton-divider" />

          <div className="skeleton-bio">
            {[140, 165, 100, 185].map((w, i) => (
              <div className="skeleton-bio-row" key={i}>
                <div className="skel skel-bio-label" />
                <div className="skel skel-bio-value" style={{ width: w }} />
              </div>
            ))}
          </div>

          <div className="banner-spacer" />

          <div className="skeleton-stats-card">
            <div className="skel skel-stats-header" style={{ borderRadius: 0 }} />
            <div className="skeleton-stats-row">
              {[0, 1, 2, 3].map((i) => (
                <div className="skeleton-stat-box" key={i}>
                  <div className="skel skel-stat-label" />
                  <div className="skel skel-stat-value" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="skeleton-tabs">
          {[0, 1, 2].map((i) => (
            <div className="skel skel-tab" key={i} />
          ))}
        </div>
      </div>

      <div className="player-dashboard-placeholder">
        <div className="skeleton-table-wrapper">
          <table>
            <thead>
              <tr>
                {SKEL_COLS.map((w, i) => (
                  <th key={i}>
                    <div className="skel skel-cell" style={{ width: w }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKEL_ROWS }).map((_, r) => (
                <tr key={r}>
                  {SKEL_COLS.map((w, i) => <SkelCell key={i} width={w} />)}
                </tr>
              ))}
              <tr className="skel-career-row">
                {SKEL_COLS.map((w, i) => <SkelCell key={i} width={w} />)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// season usually tips off around Oct 19-24, request NBA stats for the new year on Oct 22nd
function getCurrentSeason() {
  const now = new Date();
  const cutover = new Date(now.getFullYear(), 9, 22);
  const year = now >= cutover ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

export default function PlayerDetail({ season = getCurrentSeason() }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Season");
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab, loading]);
  const [injuryStatus, setInjuryStatus] = useState(null);
  const [playerLogs, setPlayerLogs] = useState([]);
  const [careerStats, setCareerStats] = useState([]);
  const [allPlayers] = useState(() => getRankedPlayers());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value.trim()) { setSearchResults([]); return; }
    setSearchResults(allPlayers.filter(p => p.name.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5));
  };

  const handleSelectPlayer = (p) => {
    setSearchTerm("");
    setSearchResults([]);
    setActiveTab("Season");
    navigate(`/player/${p.id}`);
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAll = async () => {
      // Reset all state before fetching so the skeleton shows cleanly
      setLoading(true);
      setError(null);
      setPlayer(null);
      setCareerStats([]);
      setPlayerLogs([]);

      try {
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/player/${id}`, { signal });
        if (signal.aborted) return;
        if (!profileRes.ok) { setError("Failed to load player data"); setLoading(false); return; }
        const profileData = await profileRes.json();
        if (signal.aborted) return;

        fetch(`${import.meta.env.VITE_API_URL}/api/injuries`)
          .then(r => r.json())
          .then(map => setInjuryStatus(map[profileData.name]?.status ?? null))
          .catch(() => {});

        const careerRes = await fetch(`${import.meta.env.VITE_API_URL}/api/player/${id}/careerstats`, { signal });
        if (signal.aborted) return;
        const careerData = careerRes.ok ? await careerRes.json() : null;
        if (signal.aborted) return;

        const seasons = careerData?.seasons || [];
        const latest = seasons[seasons.length - 1] || {};
        const fgm = (latest["2PM"] || 0) + (latest["3PM"] || 0);

        setPlayer({
          ...profileData,
          pts:  latest.PTS      || 0,
          reb:  latest.REB      || 0,
          ast:  latest.AST      || 0,
          stl:  latest.STL      || 0,
          blk:  latest.BLK      || 0,
          fgm,
          fga:  latest.FGA      || 0,
          fg3m: latest["3PM"]   || 0,
          ftm:  latest.FTM      || 0,
          fta:  latest.FTA      || 0,
          tov:  latest.TOV      || 0,
          teamAbbreviation: profileData.teamAbbreviation || "N/A",
          draftTeam: seasons[0]?.TEAM || null,
        });
        setCareerStats(seasons);
        setLoading(false);

        const logsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/player/${id}/gamelogs?season=${season}`,
          { signal }
        );
        if (signal.aborted) return;
        const logsData = logsRes.ok ? await logsRes.json() : null;
        if (signal.aborted) return;
        setPlayerLogs(logsData?.logs || []);

      } catch (err) {
        if (signal.aborted) return;
        console.error(err);
        setError("Failed to load player data");
        setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [id, season]);

  if (loading) return <PlayerDetailSkeleton />;
  if (error) return <div>{error}</div>;
  if (!player) return <div>No player data found.</div>;

  const playerImageUrl = `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`;
  const seasonDisplay = `${season.split("-")[0]}-${Number(season.split("-")[0]) + 1}`;
  const fgPct =
    player.fga && player.fga !== 0 ? ((player.fgm / player.fga) * 100).toFixed(1) : "0.0";

  const formatHeight = (h) => {
    if (!h) return "N/A";
    const [ft, inch] = h.split("-");
    return `${ft}' ${inch}"`;
  };

  const formatBirthdate = (bd) => {
    if (!bd) return "N/A";
    const date = new Date(bd);
    const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} (${age})`;
  };

  const formatDraft = (p) => {
    if (!p.draftYear || p.draftYear === "Undrafted") return "Undrafted";
    const rd   = p.draftRound  ? `Rd ${p.draftRound}`   : "";
    const pk   = p.draftNumber ? `, Pk ${p.draftNumber}` : "";
    const team = p.draftTeam   || p.teamAbbreviation;
    return `${p.draftYear}: ${rd}${pk} (${team})`;
  };

  return (
    <div className="player-detail-page">

      <div className="player-detail-nav">
        <Navbar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          searchResults={searchResults}
          onSelectPlayer={handleSelectPlayer}
        />
      </div>

      <div className="player-banner">
        <div className="banner-content" style={{ background: TIER_GRADIENTS[getPlayerTier(player)] }}>

          <div className="banner-left">
            <img className="player-image" src={playerImageUrl} alt={player.name} />
          </div>

          <div className="banner-identity">
            <div className={`player-status ${injuryStatus ? (
                injuryStatus === "Out" ? "status-out" :
                injuryStatus === "Questionable" ? "status-questionable" :
                "status-dtd"
              ) : "status-active"}`}
            >
              <span className="player-status-dot" />
              {injuryStatus || "Active"}
            </div>
            <h1 className="player-name-large">
              {(() => {
                const SUFFIXES = ["Jr.", "Sr.", "Jr", "Sr", "II", "III", "IV", "V"];
                const parts = (player.name || "").split(" ");
                const hasSuffix = parts.length > 2 && SUFFIXES.includes(parts[parts.length - 1]);
                const suffix = hasSuffix ? ` ${parts[parts.length - 1]}` : "";
                const core = hasSuffix ? parts.slice(0, -1) : parts;
                const firstName = core.slice(0, -1).join(" ");
                const lastName = core[core.length - 1] + suffix;

                return (
                  <>
                    <span className="player-first-name">{firstName}</span>
                    {lastName.includes("-")
                      ? lastName.split("-").map((part, i, arr) => (
                          <span key={i} className="player-last-name">
                            {part}{i < arr.length - 1 ? "-" : ""}
                          </span>
                        ))
                      : <span className="player-last-name">{lastName}</span>
                    }
                  </>
                );
              })()}
            </h1>
            <div
              className="banner-tier-badge"
              style={{ background: TIER_BADGE_GRADIENTS[getPlayerTier(player)] }}
            >
              <span>{TIER_ICONS[getPlayerTier(player)]}</span>
              {getPlayerTier(player)}
            </div>

            <p className="player-meta">
              {player.teamLogo && (
                <img className="meta-team-logo" src={player.teamLogo} alt={player.teamAbbreviation} />
              )}
              {player.teamAbbreviation} • #{player.jersey || "00"} • {player.position || "N/A"}
            </p>
          </div>

          <div className="banner-spacer" />
          <div className="banner-divider" />
          <div className="banner-bio">
            <div className="bio-row">
              <span className="bio-label">Height / Weight</span>
              <span className="bio-value">{formatHeight(player.height)}, {player.weight || "N/A"} lbs</span>
            </div>
            <div className="bio-row">
              <span className="bio-label">Birthdate</span>
              <span className="bio-value">{formatBirthdate(player.birthdate)}</span>
            </div>
            <div className="bio-row">
              <span className="bio-label">College</span>
              <span className="bio-value">{player.school || "N/A"}</span>
            </div>
            <div className="bio-row">
              <span className="bio-label">Draft Info</span>
              <span className="bio-value">{formatDraft(player)}</span>
            </div>
          </div>

          <div className="banner-spacer" />
          <div className="banner-right">
            <div className="season-stats-card">
              <div className="season-title" style={{ background: TIER_COLORS[getPlayerTier(player)] }}>{seasonDisplay} Regular Season Stats</div>
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-label">PTS</div>
                  <div className="stat-value">{player.pts || 0}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">REB</div>
                  <div className="stat-value">{player.reb || 0}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">AST</div>
                  <div className="stat-value">{player.ast || 0}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">FG%</div>
                  <div className="stat-value">{fgPct}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="banner-bottom">
          <div className="banner-h-divider" />
          <div className="banner-tabs">
            {["Season", "Game Logs", "Charts"].map((tab) => (
              <button
                key={tab}
                ref={(el) => (tabRefs.current[tab] = el)}
                className={`banner-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
            {indicator && (
              <div
                className="tab-indicator"
                style={{ left: indicator.left, width: indicator.width }}
              />
            )}
          </div>
        </div>

      </div>

      <div className="player-dashboard-placeholder">
        {activeTab === "Season" && (
          <SeasonStatsTable stats={careerStats} playerPosition={player.position} />
        )}

        {activeTab === "Game Logs" && (
          <GameLogsTable
            logs={playerLogs}
            playerTeam={player.teamAbbreviation}
            playerPosition={player.position}
          />
        )}

        {activeTab === "Charts" && player && (
          <div className="charts-section">
            <div className="charts-row-three">
              <div className="chart-card">
                <h3 className="chart-title">Player Build</h3>
                <div className="chart-radar-wrapper">
                  <PlayerRadarChart player={player} />
                </div>
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Scoring Breakdown</h3>
                <ScoringBreakdownChart player={player} />
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Last 10 Games</h3>
                <RecentFormChart logs={playerLogs} />
              </div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">ClutchScore Season Trend</h3>
              <FantasyPointsTrendChart logs={playerLogs} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
