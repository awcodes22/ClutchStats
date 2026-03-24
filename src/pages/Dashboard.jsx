import { useState, useEffect } from "react";
import "../styles/App.css";
import PlayerCard from "../components/PlayerCard";
import Navbar from "../components/Navbar";
import { getRankedPlayers  } from "../utils/fantasyEngine";
import teamLogos from "../data/teamLogos";

const tierOptions = ["All", "Elite Start", "Strong Start", "Flex Play", "Bench"];

const tierColors = {
  "Elite Start": "rgba(245,158,11,1)",
  "Strong Start": "rgba(142,68,173,1)",
  "Flex Play": "rgba(52,152,219,1)",
  "Bench": "rgb(103, 107, 110)",
  "All": "#3b3b3b", // inactive default grey
};

function PlayerCardSkeleton({ index = 0 }) {
  return (
    <div className="card skel-card" style={{ animationDelay: `${index * 55}ms` }}>
      <div className="card-img-section skel-card-img-section">
        <div className="skel skel-card-badge skel-card-rank" />
        <div className="skel skel-card-badge skel-card-tier" />
        <svg
          className="skel-card-figure"
          viewBox="0 0 24 24"
          fill="#c8c8c8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
      <svg
        className="card-curve-divider"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,0 Q200,100 400,0 L400,100 L0,100 Z" fill="#ffffff" />
      </svg>
      <div className="card-identity-group">
        <div className="skel skel-card-status" />
        <div className="card-identity-row">
          <div className="skel skel-card-logo" />
          <div className="card-identity-divider" />
          <div className="skel skel-card-name" />
        </div>
      </div>
      <div className="card-h-divider" />
      <div className="card-body">
        <div className="card-stats-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`stat-cell stat-cell-${i + 1}`}>
              <div className="skel skel-card-stat-label" />
              <div className="skel skel-card-stat-value" />
            </div>
          ))}
        </div>
        <div className="card-h-divider" style={{ marginTop: 10 }} />
        <div className="clutch-score-row">
          <div className="skel skel-card-clutch-label" />
          <div className="skel skel-card-clutch-value" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState(() => localStorage.getItem("tierFilter") || "All");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const rankedPlayers = getRankedPlayers();

    fetch(`${import.meta.env.VITE_API_URL}/api/injuries`)
      .then((r) => r.json())
      .then((injuryMap) => {
        setPlayers(
          rankedPlayers.map((p) => ({
            ...p,
            injuryStatus: injuryMap[p.name]?.status ?? null,
          }))
        );
      })
      .catch(() => setPlayers(rankedPlayers));

    const id = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(id);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    const matches = players
      .filter((player) =>
        player.name.toLowerCase().startsWith(value.toLowerCase())
      )
      .slice(0, 5);
    setSearchResults(matches);
  };

  const handleSelectPlayer = (player) => {
    setSearchTerm(player.name);
    setSearchResults([]);
  };

  const displayedPlayers = players.filter(
    (player) =>
      (tierFilter === "All" || player.tier === tierFilter) &&
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <div className="main">
        <div className="dashboard-header">
          <Navbar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            searchResults={searchResults}
            onSelectPlayer={handleSelectPlayer}
          />
          <div className="tier-pills-inline">
            {tierOptions.map((tier) => (
              <button
                key={tier}
                className={`pill-inline${tierFilter === tier ? " active" : ""}`}
                style={tierFilter === tier ? { backgroundColor: tierColors[tier] } : {}}
                onClick={() => { setTierFilter(tier); localStorage.setItem("tierFilter", tier); }}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="cards-container-header">
          <div className="dashboard-header-count">{displayedPlayers.length} Players</div>
        </div>
        <div className="cards-container">
          <div className="card-wrapper">
            <div className="card-grid">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <PlayerCardSkeleton key={i} index={i} />)
                : displayedPlayers.map((player, idx) => (
                <PlayerCard
                  key={`${player.id}-${tierFilter}`}
                  id={player.id}
                  name={player.name}
                  team={player.team}
                  pts={player.pts}
                  ast={player.ast}
                  reb={player.reb}
                  injuryStatus={player.injuryStatus}
                  fantasyScore={player.fantasyScore}
                  tier={player.tier}
                  rank={player.rank}
                  teamLogos={teamLogos}
                  // Only animate the first 16 cards — cards beyond the initial
                  // viewport skip the entrance animation to avoid staggered animations and lag of site
                  animated={idx < 16}
                  cardDelay={idx < 16 ? idx * 55 : 0}
                  style={idx < 16 ? { animationDelay: `${idx * 55}ms`, '--card-delay': `${idx * 55}ms` } : {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;