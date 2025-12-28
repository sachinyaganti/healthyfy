import MentalModuleShell from '../domains/mental/MentalModuleShell.jsx'
import MentalLanding from '../domains/mental/MentalLanding.jsx'
import { GLOBAL_DISCLAIMER } from '../constants/disclaimer.js'

export default function MentalWellness() {
  return (
    <div className="page">
      <div className="container">
        <div className="mb-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] px-4 py-3 text-sm">
          {GLOBAL_DISCLAIMER}
        </div>
        <MentalModuleShell>
          <MentalLanding />
        </MentalModuleShell>
      </div>
    </div>
  )
}
