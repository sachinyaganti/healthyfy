import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function LineChart({ title, labels, data, yLabel }) {
  const rootStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const lineColor = (rootStyle?.getPropertyValue('--chart-line') || '').trim() || '#2563eb'
  const fillColor = (rootStyle?.getPropertyValue('--chart-fill') || '').trim() || 'rgba(37, 99, 235, 0.12)'

  const chartData = {
    labels,
    datasets: [
      {
        label: yLabel || 'Value',
        data,
        borderColor: lineColor,
        backgroundColor: fillColor,
        tension: 0.25,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { color: '#475569' } },
      title: { display: Boolean(title), text: title },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#475569' },
        grid: { color: 'rgba(226, 232, 240, 0.9)' },
      },
      x: {
        ticks: { color: '#475569' },
        grid: { color: 'rgba(226, 232, 240, 0.65)' },
      },
    },
  }

  return <Line data={chartData} options={options} />
}
