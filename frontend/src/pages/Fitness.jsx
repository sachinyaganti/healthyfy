import FitnessDashboard from '../domains/fitness/FitnessDashboard.jsx'
import WellnessCard from '../components/Cards/WellnessCard.jsx'

export default function Fitness() {
  return (
    <div className="space-y-4">
      <WellnessCard title="Personal Fitness Coaching" icon="💪">
        Habit-friendly movement ideas, streaks, and motivation.
      </WellnessCard>
      <FitnessDashboard />
    </div>
  )
}
