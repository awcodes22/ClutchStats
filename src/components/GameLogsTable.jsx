import { useState } from "react";
import "../styles/GameLogsTable.css";
import teamLogos from "../data/teamLogos";

export default function GameLogsTable({ logs, playerTeam, playerPosition }) {
  const [displayCount, setDisplayCount] = useState("5");

  if (!logs || !logs.length) {
    return <div className="no-logs">No game logs available.</div>;
  }

  const columns = [
    { label: "DATE", key: "GAME_DATE" },
    { label: "TEAM", key: "TEAM" },
    { label: "OPP", key: "OPP" },
    { label: "POS", key: "POS" },
    { label: "FPTS", key: "FPTS" },
    { label: "MIN", key: "MIN" },
    { label: "PTS", key: "PTS" },
    { label: "REB", key: "REB" },
    { label: "AST", key: "AST" },
    { label: "BLK", key: "BLK" },
    { label: "STL", key: "STL" },
    { label: "FG%", key: "FG%" },
    { label: "FT%", key: "FT%" },
    { label: "3P%", key: "3P%" },
    { label: "FTM", key: "FTM" },
    { label: "2PM", key: "2PM" },
    { label: "3PM", key: "3PM" },
    { label: "TOV", key: "TOV" },
  ];

  const displayedLogs =
    displayCount === "All" ? logs : logs.slice(0, Number(displayCount));

  return (
    <div className="game-logs-section">
      <div className="logs-filter-buttons">
  {["5", "10", "All"].map((count) => (
    <button
      key={count}
      className={`filter-btn ${displayCount === count ? "active" : ""}`}
      onClick={() => setDisplayCount(count)}
      title={
        count === "All"
          ? "Show all games"
          : `Show last ${count} games`
      }
    >
      {count === "All" ? "All Games" : `Last ${count} Games`}
    </button>
  ))}
</div>

      <table className="game-logs-table">
        <thead>
          <tr>
            {columns.map(({ label }) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody key={displayCount}>
          {displayedLogs.map((game, idx) => (
            <tr key={idx} style={{ animationDelay: `${idx * 35}ms` }}>
              {columns.map(({ key }) => {
                if (key === "TEAM") {
                  const abbr = playerTeam ?? "-";
                  const logo = teamLogos[abbr];
                  return (
                    <td key={key}>
                      <span className="team-cell">
                        {logo && <img src={logo} alt={abbr} className="team-logo-sm" />}
                        {abbr}
                      </span>
                    </td>
                  );
                }
                if (key === "OPP") {
                  const abbr = game.OPP ?? "-";
                  const logo = teamLogos[abbr];
                  return (
                    <td key={key}>
                      <span className="team-cell">
                        {logo && <img src={logo} alt={abbr} className="team-logo-sm" />}
                        {abbr}
                      </span>
                    </td>
                  );
                }
                if (key === "POS") return <td key={key}>{playerPosition ?? "-"}</td>;

                const val = game[key] ?? "-";
                let cls = "";
                if (key === "PTS"  && val >= 25) cls = "cell-teal";
                if (key === "REB"  && val >= 10) cls = "cell-blue";
                if (key === "AST"  && val >= 8)  cls = "cell-purple";
                if (key === "BLK"  && val >= 2)  cls = "cell-purple";
                if (key === "STL"  && val >= 2)  cls = "cell-purple";
                if (key === "TOV"  && val >= 5)  cls = "cell-amber";
                if (key === "FPTS" && val >= 50) cls = "cell-teal";

                return <td key={key} className={cls}>{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}