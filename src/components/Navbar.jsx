import { useNavigate } from "react-router-dom";

function Navbar({ searchTerm, onSearchChange, searchResults, onSelectPlayer }) {
  const navigate = useNavigate();

  return (
    <div className="navbar">

      <img
        className="ClutchStatsLogo"
        src="/images/ClutchStats.svg"
        alt="ClutchStats Logo"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      />

      <div className="search-wrapper">
        <svg
          className="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search player..."
          value={searchTerm}
          onChange={onSearchChange}
          className="search-input"
        />
        {searchResults?.length > 0 && (
          <ul className="autocomplete-list">
            {searchResults.map((player) => (
              <li key={player.id} onMouseDown={() => onSelectPlayer(player)}>
                {player.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Navbar;
