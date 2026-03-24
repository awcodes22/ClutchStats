import "../styles/SeasonStatsTable.css";
import teamLogos from "../data/teamLogos";

function SeasonStatsTable({ stats, playerPosition }) {
  if (!stats || stats.length === 0) {
    return <div>No season stats available.</div>;
  }

  const ordered = [...stats].reverse();
  const fmt = (v) => (v != null && v !== "" ? Number(v).toFixed(2) : "—");

  // GP-weighted career averages rather than a simple mean of seasons
  const totalGP = stats.reduce((sum, s) => sum + (s.GP || 0), 0);
  const wavg = (field) =>
    totalGP > 0
      ? (stats.reduce((sum, s) => sum + (parseFloat(s[field]) || 0) * (s.GP || 0), 0) / totalGP).toFixed(2)
      : "—";

  const totalFPTS = stats.reduce((sum, s) => sum + (parseFloat(s["FPTS/G"]) || 0) * (s.GP || 0), 0);

  return (
    <div className="season-stats-table-wrapper">
      <table className="season-stats-table">
        <thead>
          <tr>
            <th>SEASON</th>
            <th>TEAM</th>
            <th>POS</th>
            <th>GP</th>
            <th>FPTS/G</th>
            <th>MIN</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>BLK</th>
            <th>STL</th>
            <th>FG%</th>
            <th>FT%</th>
            <th>3P%</th>
            <th>FTM</th>
            <th>2PM</th>
            <th>3PM</th>
            <th>TOV</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((season, idx) => (
            <tr key={idx} style={{ animationDelay: `${idx * 45}ms` }}>
              <td>{season.SEASON}</td>
              <td>
                <span className="team-cell">
                  {teamLogos[season.TEAM] && (
                    <img src={teamLogos[season.TEAM]} alt={season.TEAM} className="team-logo-sm" />
                  )}
                  {season.TEAM}
                </span>
              </td>
              <td>{season.POS || playerPosition || "—"}</td>
              <td>{season.GP}</td>
              <td>{fmt(season["FPTS/G"])}</td>
              <td>{fmt(season.MIN)}</td>
              <td>{fmt(season.PTS)}</td>
              <td>{fmt(season.REB)}</td>
              <td>{fmt(season.AST)}</td>
              <td>{fmt(season.BLK)}</td>
              <td>{fmt(season.STL)}</td>
              <td>{fmt(season["FG%"])}</td>
              <td>{fmt(season["FT%"])}</td>
              <td>{fmt(season["3P%"])}</td>
              <td>{fmt(season.FTM)}</td>
              <td>{fmt(season["2PM"])}</td>
              <td>{fmt(season["3PM"])}</td>
              <td>{fmt(season.TOV)}</td>
            </tr>
          ))}
          <tr className="career-row" style={{ animationDelay: `${ordered.length * 45}ms` }}>
            <td>Career</td>
            <td>—</td>
            <td>{playerPosition || "—"}</td>
            <td>{totalGP}</td>
            <td>{totalGP > 0 ? (totalFPTS / totalGP).toFixed(2) : "—"}</td>
            <td>{wavg("MIN")}</td>
            <td>{wavg("PTS")}</td>
            <td>{wavg("REB")}</td>
            <td>{wavg("AST")}</td>
            <td>{wavg("BLK")}</td>
            <td>{wavg("STL")}</td>
            <td>{wavg("FG%")}</td>
            <td>{wavg("FT%")}</td>
            <td>{wavg("3P%")}</td>
            <td>{wavg("FTM")}</td>
            <td>{wavg("2PM")}</td>
            <td>{wavg("3PM")}</td>
            <td>{wavg("TOV")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default SeasonStatsTable;
