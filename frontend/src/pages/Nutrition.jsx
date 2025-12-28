import NutritionDashboard from '../domains/nutrition/NutritionDashboard.jsx'
import WellnessCard from '../components/Cards/WellnessCard.jsx'

export default function Nutrition() {
  return (
    <div className="space-y-4">
      <WellnessCard title="Nutrition Planning" icon="🥗">
        Meal planning ideas and simple dietary guidance.
      </WellnessCard>
      <NutritionDashboard />
    </div>
  )
}
