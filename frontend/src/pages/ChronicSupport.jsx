import ChronicDashboard from '../domains/chronic/ChronicDashboard.jsx'
import WellnessCard from '../components/Cards/WellnessCard.jsx'

export default function ChronicSupport() {
  return (
    <div className="space-y-4">
      <WellnessCard title="Chronic Support (Non-Diagnostic)" icon="🫶">
        Lifestyle tips and community inspiration—no diagnosis or treatment.
      </WellnessCard>
      <ChronicDashboard />
    </div>
  )
}
