import { Line } from "react-chartjs-2";
import "../styles/Charts.css";
import { useChartReveal } from "../utils/animations";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const RECENT_GAMES = 10;

export default function RecentFormChart({ logs }) {
  const ready = useChartReveal(logs, 350);

  if (!logs || logs.length === 0) return <p>No game log data available.</p>;

  const recentGames = [...logs].slice(0, RECENT_GAMES).reverse();
  const labels = recentGames.map((g) => `vs ${g.OPP}`);
  const zeros = recentGames.map(() => 0);

  const data = {
    labels,
    datasets: [
      {
        label: "PTS",
        data: ready ? recentGames.map((g) => g.PTS) : zeros,
        borderColor: "#7ec8c8",
        backgroundColor: "rgba(126, 200, 200, 0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#7ec8c8",
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
      },
      {
        label: "REB",
        data: ready ? recentGames.map((g) => g.REB) : zeros,
        borderColor: "#9b8ec4",
        backgroundColor: "rgba(155, 142, 196, 0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#9b8ec4",
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
      },
      {
        label: "AST",
        data: ready ? recentGames.map((g) => g.AST) : zeros,
        borderColor: "#6cb8f0",
        backgroundColor: "rgba(108, 184, 240, 0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#6cb8f0",
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
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
      tension: {
        duration: 2500,
        easing: "easeInOutSine",
        from: 0.4,
        to: 0.15,
        loop: true,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 6,
          boxHeight: 6,
          font: { size: 11 },
          color: "#1a1a1a",
          padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const game = recentGames[items[0].dataIndex];
            return `${game.GAME_DATE} vs ${game.OPP}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#1a1a1a", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { color: "#1a1a1a", font: { size: 11 } },
        title: { display: false },
      },
    },
  };

  return (
    <div className="chart-container-recent">
      <Line data={data} options={options} />
    </div>
  );
}
