import { Doughnut } from "react-chartjs-2";
import "../styles/Charts.css";
import { useChartReveal } from "../utils/animations";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ScoringBreakdownChart({ player }) {
  const ready = useChartReveal(player, 300);

  if (!player) return null;

  const twoPM     = (player.fgm  || 0) - (player.fg3m || 0);
  const ptsFrom2  = twoPM * 2;
  const ptsFrom3  = (player.fg3m || 0) * 3;
  const ptsFromFT = player.ftm  || 0;

  if (ptsFrom2 + ptsFrom3 + ptsFromFT === 0) {
    return <p>No scoring data available.</p>;
  }

  const total = ptsFrom2 + ptsFrom3 + ptsFromFT;

  const data = {
    labels: ["2-Pointers", "3-Pointers", "Free Throws"],
    datasets: [
      {
        label: "Pts / Gm",
        data: [ptsFrom2, ptsFrom3, ptsFromFT],
        backgroundColor: [
          "rgba(126, 200, 200, 0.85)",
          "rgba(155, 142, 196, 0.85)",
          "rgba(108, 184, 240, 0.85)",
        ],
        borderColor: ["#7ec8c8", "#9b8ec4", "#6cb8f0"],
        borderWidth: 2,
        hoverBackgroundColor: [
          "rgba(126, 200, 200, 1)",
          "rgba(155, 142, 196, 1)",
          "rgba(108, 184, 240, 1)",
        ],
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 2,
    cutout: "52%",
    rotation: -90,
    circumference: ready ? 360 : 0,
    layout: { padding: 12 },
    animation: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 11, weight: "600" },
          color: "#333",
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (item) => {
            const pct = ((item.raw / total) * 100).toFixed(1);
            return ` ${item.raw.toFixed(1)} pts/gm (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-container-donut">
      <Doughnut data={data} options={options} />
    </div>
  );
}
