import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useCountUp } from "../utils/animations";

const STATUS_CLASS = {
  "Out":         "status-out",
  "Day-To-Day":  "status-dtd",
  "Doubtful":    "status-dtd",
  "Questionable":"status-questionable",
};

function PlayerCard({ id, name, team, pts, ast, reb, fantasyScore, tier, teamLogos, rank, style, cardDelay = 0, animated = true, injuryStatus = null }) {
  const navigate = useNavigate();
  const scoreRef = useRef(null);

  useCountUp(scoreRef, fantasyScore, { duration: 1600, delay: cardDelay + 520 });

  const tierClassMap = {
    "Elite Start": "elite-start",
    "Strong Start": "strong-start",
    "Flex Play":    "flex-play",
    "Bench":        "bench",
  };

  const tierIconMap = {
    "Elite Start": "👑",
    "Strong Start": "⚡",
    "Flex Play":    "🔀",
    "Bench":        "🪑",
  };

  const bgClass = tierClassMap[tier] || "bench";

  return (
    <div
      className={`card ${bgClass}${animated ? "" : " card-no-anim"}`}
      style={style}
      onClick={() => navigate(`/player/${id}`)}
    >
      <div className="card-img-section">
        <div className="card-img-bg" />
        <img
          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`}
          alt={name}
          className="player-img"
        />
        <div className="rank-indicator">#{rank}</div>
        <div className="tier-badge">
          <span className="tier-badge-icon">{tierIconMap[tier]}</span>
          {tier}
        </div>
      </div>

      <svg
        className="card-curve-divider"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,0 Q200,100 400,0 L400,100 L0,100 Z" fill="#ffffff" />
      </svg>

      <div className="card-content">
        <div className="card-identity-group">
          <div className={`player-status ${injuryStatus ? (STATUS_CLASS[injuryStatus] || "status-questionable") : "status-active"}`}>
            <span className="player-status-dot" />
            {injuryStatus || "Active"}
          </div>
          <div className="card-identity-row">
            <img src={teamLogos[team] || ""} alt={team} className="card-team-logo" />
            <div className="card-identity-divider" />
            <h2 className="player-name">{name}</h2>
          </div>
        </div>
        <div className="card-h-divider" />

        <div className="card-body">
        <div className="card-stats-grid">
          <div className="stat-cell stat-cell-1">
            <span className="stat-label-pill">PTS</span>
            <span className="stat-number-pill">{pts}</span>
          </div>
          <div className="stat-cell stat-cell-2">
            <span className="stat-label-pill">AST</span>
            <span className="stat-number-pill">{ast}</span>
          </div>
          <div className="stat-cell stat-cell-3">
            <span className="stat-label-pill">REB</span>
            <span className="stat-number-pill">{reb}</span>
          </div>
        </div>

        <div className="card-h-divider" />
        <div className="clutch-score-row">
          <span className="clutch-label">ClutchScore</span>
          <span className="clutch-value" ref={scoreRef}>0</span>
        </div>
        </div>

      </div>
    </div>
  );
}

export default PlayerCard;
