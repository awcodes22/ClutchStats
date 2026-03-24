// ======================================================
// main.jsx
// Application entry point — mounts the React app into
// the DOM inside a BrowserRouter for client-side routing.
// ======================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App'
import './styles/animations.css'

// ---------------- MOUNT ----------------
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);