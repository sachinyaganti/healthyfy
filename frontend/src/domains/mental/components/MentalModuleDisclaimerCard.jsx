export default function MentalModuleDisclaimerCard() {
  return (
    <div className="card mentalDisclaimerCard">
      <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700 }}>🧠 Mental Wellness & Stress Management</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Healthyfy supports mental wellness and stress management.
            <br />
            It does not diagnose, treat, or replace professional mental health care.
          </div>
        </div>
        <div className="mentalDisclaimerPill">Non-medical</div>
      </div>
    </div>
  )
}
