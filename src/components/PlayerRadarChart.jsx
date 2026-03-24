import { Radar } from "react-chartjs-2";
import "../styles/Charts.css";
import { useChartReveal } from "../utils/animations";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const STAT_KEYS = ["FG%", "PTS", "AST", "REB", "STL", "BLK"];
const MAX_VALUES = { "FG%": 100, PTS: 50, AST: 15, REB: 20, STL: 5, BLK: 5 };

function computeNormalized(player) {
  const raw = {
    "FG%": player.fga ? (player.fgm / player.fga) * 100 : 0,
    PTS:   player.pts || 0,
    AST:   player.ast || 0,
    REB:   player.reb || 0,
    STL:   player.stl || 0,
    BLK:   player.blk || 0,
  };
  return STAT_KEYS.map((k) => (raw[k] / MAX_VALUES[k]) * 100);
}

export default function PlayerRadarChart({ player }) {
  const ready = useChartReveal(player, 350);
  const displayData = ready ? computeNormalized(player) : STAT_KEYS.map(() => 0);

  if (!player) return null;

  const rawStats = {
    "FG%": player.fga ? (player.fgm / player.fga) * 100 : 0,
    PTS: player.pts || 0,
    AST: player.ast || 0,
    REB: player.reb || 0,
    STL: player.stl || 0,
    BLK: player.blk || 0,
  };

  const data = {
    labels: STAT_KEYS,
    datasets: [
      {
        label: "Player Build",
        data: displayData,
        backgroundColor: "rgba(126, 200, 200, 0.2)",
        borderColor: "#7ec8c8",
        borderWidth: 2.5,
        pointBackgroundColor: "#7ec8c8",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: "easeInOutCubic",
    },
    animations: {
      pointRadius: {
        duration: 2500,
        easing: "easeInOutSine",
        from: 5,
        to: 8,
        loop: true,
      },
    },
    scales: {
      r: {
        angleLines: { color: "rgba(0,0,0,0.08)" },
        grid: { color: "rgba(0,0,0,0.08)" },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { stepSize: 25, display: false },
        pointLabels: {
          font: { size: 12, weight: "600" },
          color: "#1a1a1a",
        },
      },
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            const statName = context.label;
            return `${statName}: ${Number(rawStats[statName]).toFixed(1)}`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-container-radar">
      <Radar data={data} options={options} />
    </div>
  );
}
