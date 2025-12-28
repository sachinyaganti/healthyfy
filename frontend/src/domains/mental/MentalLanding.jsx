import { NavLink } from 'react-router-dom'
import trackingImg from '../../assets/mental/tracking.svg'
import activitiesImg from '../../assets/mental/activities.svg'

const DISCLAIMER = `Healthyfy supports mental wellness and stress management.\nIt does not diagnose, treat, or replace professional mental health care.`

export default function MentalLanding() {
  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="grid two mentalLandingCards">
        <div className="card mentalLandingCard">
          <img
            src={trackingImg}
            alt="Illustration representing journaling and mood tracking"
            className="mentalLandingImage"
            loading="lazy"
          />

          <div className="mentalLandingBody">
            <div>
              <div className="mentalLandingTitle">Self Mental Wellness Tracking</div>
              <div className="mentalLandingDesc">
                Track mood & stress, journal daily, and receive non-clinical insights.
              </div>
            </div>

            <NavLink to="tracking" className="btn primary mentalLandingCta">
              View Insights & Tracking
            </NavLink>

            <div className="muted mentalLandingDisclaimer">{DISCLAIMER}</div>
          </div>
        </div>

        <div className="card mentalLandingCard">
          <img
            src={activitiesImg}
            alt="Illustration representing calm activities and relaxation"
            className="mentalLandingImage"
            loading="lazy"
          />

          <div className="mentalLandingBody">
            <div>
              <div className="mentalLandingTitle">Stress Relief & Wellness Activities</div>
              <div className="mentalLandingDesc">
                Guided exercises, videos, audio relaxation, and calm activities.
              </div>
            </div>

            <NavLink to="activities" className="btn primary mentalLandingCta">
              Open Activities
            </NavLink>

            <div className="muted mentalLandingDisclaimer">{DISCLAIMER}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
