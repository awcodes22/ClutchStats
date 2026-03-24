// ======================================================
// App.jsx
// Root component — defines the top-level route structure.
// /              → Dashboard (player rankings grid)
// /player/:id   → PlayerDetail (individual player page)
// ======================================================

import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PlayerDetail from "./pages/PlayerDetail";

// ---------------- ROUTES ----------------
function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/player/:id" element={<PlayerDetail />} />
    </Routes>
  );
}

export default App;