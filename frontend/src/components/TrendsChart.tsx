import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import type { ChartOptions } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
);

interface Reading {
  datetime: string;
  value: number;
}

interface TrendsChartProps {
  readings?: Reading[];
}

const TrendsChart: React.FC<TrendsChartProps> = ({ readings = [] }) => {
  const sorted = readings
    .slice()
    .sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  const labels = sorted.map((r) => new Date(r.datetime).toLocaleString());
  const dataVals = sorted.map((r) => r.value);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Blood Sugar",
          data: dataVals,
          fill: false,
          tension: 0.2,
          pointRadius: 3,
          borderColor: "#2b7cff",
          backgroundColor: "#2b7cff",
        },
      ],
    }),
    [labels.join(","), dataVals.join(",")]
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { ticks: { maxRotation: 30, minRotation: 0 } },
      y: { beginAtZero: false },
    },
  };

  return (
    <div className="card">
      <div className="card-hd">
        <h4 style={{marginLeft: '8px'}}>Trend</h4> {/* Added margin-left to shift right */}
      </div>
      <div className="card-bd">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default TrendsChart;
