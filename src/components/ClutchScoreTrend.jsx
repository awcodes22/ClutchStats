import { useRef } from "react";
import { Line } from "react-chartjs-2";
import "../styles/Charts.css";
import { calculateClutchScore } from "../utils/fantasyEngine";
import { useInView } from "../utils/animations";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function FantasyPointsTrendChart({ logs }) {
  const containerRef = useRef(null);
  // Fires once the chart container is 10% visible. Resets when logs change
  // (new player) so the animation replays after navigating between players.
  const inView = useInView(containerRef, { threshold: 0.1, resetOn: logs });

  if (!logs || logs.length === 0) {
    return (
      <div className="chart-container-trend" ref={containerRef}>
        <p>No game log data available.</p>
      </div>
    );
  }

  const chronological = [...logs].reverse();
  const labels = chronological.map((g) => `vs ${g.OPP} (${g.GAME_DATE})`);

  // Reconstruct the inputs required by calculateClutchScore from game log fields.
  // Game logs store FG% and FT% as percentages, not raw counts, so we back-
  // calculate FGA and FTA from makes and percentage to get the miss counts.
  const fpts = chronological.map((g) => {
    const fgm   = (g["2PM"] || 0) + (g["3PM"] || 0);
    const fgPct = parseFloat(g["FG%"]) || 0;
    // fga = fgm / (fgPct / 100) — reverse of pct = makes/attempts
    const fga   = fgPct > 0 ? Math.round(fgm / (fgPct / 100)) : 0;
    const ftm   = g.FTM || 0;
    const ftPct = parseFloat(g["FT%"]) || 0;
    const fta   = ftPct > 0 ? Math.round(ftm / (ftPct / 100)) : 0;

    return Math.round(calculateClutchScore({
      pts: g.PTS, reb: g.REB, ast: g.AST, stl: g.STL, blk: g.BLK,
      fgm, fg3m: g["3PM"] || 0, fga, ftm, fta, tov: g.TOV || 0,
    }));
  });

  const avgFpts = (fpts.reduce((a, b) => a + b, 0) / fpts.length).toFixed(1);

  const minFpts = 0;
  const maxFpts = Math.ceil(Math.max(...fpts) / 10) * 10 + 10;

  const data = {
    labels,
    datasets: [
      {
        label: "ClutchScore",
        data: fpts,
        borderColor: "#7ec8c8",
        backgroundColor: "rgba(126, 200, 200, 0.12)",
        borderWidth: 2.5,
        pointBackgroundColor: "#7ec8c8",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: `Season Avg (${avgFpts})`,
        data: fpts.map(() => Number(avgFpts)),
        borderColor: "#999",
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const totalDuration = 1200;
  const delay = totalDuration / fpts.length;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      x: {
        type: "number",
        easing: "linear",
        duration: delay,
        from: NaN,
        delay(ctx) {
          if (ctx.type !== "data" || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * delay;
        },
      },
      y: {
        type: "number",
        easing: "easeInOutSine",
        duration: delay * 8,
        from: NaN,
        delay(ctx) {
          if (ctx.type !== "data" || ctx.yStarted) return 0;
          ctx.yStarted = true;
          return ctx.index * delay;
        },
      },
      tension: {
        duration: 2500,
        easing: "easeInOutSine",
        from: 0.4,
        to: 0.1,
        loop: true,
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12 },
          color: "#1a1a1a",
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => chronological[items[0].dataIndex].GAME_DATE,
          label: (item) =>
            item.datasetIndex === 0
              ? `ClutchScore: ${item.raw}`
              : `Avg: ${item.raw}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { display: false },
        grid: { display: false },
      },
      y: {
        min: minFpts,
        max: maxFpts,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { color: "#1a1a1a", font: { size: 11 }, stepSize: 10 },
        title: { display: false },
      },
    },
  };

  return (
    <div className="chart-container-trend" ref={containerRef}>
      {inView && <Line data={data} options={options} />}
    </div>
  );
}
