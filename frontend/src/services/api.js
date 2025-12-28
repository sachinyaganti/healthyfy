const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      msg = data?.detail || data?.message || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  return res.json()
}

export const api = {
  health: () => request('/health'),
  chat: ({ message, user_context }) => request('/api/chat', { method: 'POST', body: { message, user_context } }),
  fitnessPlan: ({ goal, level }) => request('/api/fitness/plan', { method: 'POST', body: { goal, level } }),
  nutritionPlan: ({ preference, allergies }) =>
    request('/api/nutrition/plan', { method: 'POST', body: { preference, allergies } }),
  breathing: ({ minutes }) => request('/api/mental/breathing', { method: 'POST', body: { minutes } }),
  journalPrompt: () => request('/api/mental/journal-prompt'),
  chronicSupport: ({ condition }) => request('/api/chronic/support', { method: 'POST', body: { condition } }),
  retrieveWellness: ({ query, k }) => request('/api/wellness/retrieve', { method: 'POST', body: { query, k } }),
  mlForecast: ({ series, horizon }) => request('/api/ml/forecast', { method: 'POST', body: { series, horizon } }),
  coachGoal: ({ user_id, goal, horizon_days, context }) =>
    request('/api/coach/goal', { method: 'POST', body: { user_id, goal, horizon_days, context } }),
  coachCheckin: ({ plan_id, adherence, metrics, notes }) =>
    request('/api/coach/checkin', { method: 'POST', body: { plan_id, adherence, metrics, notes } }),
  coachState: ({ plan_id }) => request(`/api/coach/state/${encodeURIComponent(plan_id)}`),
}
