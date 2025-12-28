import { daysAgoIsoDate, isWithinLastNDays } from './dates.js'

// NOTE (prototype): These are simple, rule-based insights.
// They are intentionally non-medical: no diagnosis, no treatment, no prescriptions.

function trendDirection(values) {
  if (values.length < 2) return 'flat'
  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first
  if (Math.abs(delta) < 0.00001) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

export function fitnessInsights({ workouts, habits }) {
  const last7Workouts = (workouts || []).filter((w) => isWithinLastNDays(w.date, 7))
  const minutesByDay = new Map()
  for (const w of last7Workouts) {
    minutesByDay.set(w.date, (minutesByDay.get(w.date) || 0) + Number(w.minutes || 0))
  }

  const days = Array.from({ length: 7 }, (_, i) => daysAgoIsoDate(6 - i))
  const values = days.map((d) => minutesByDay.get(d) || 0)
  const direction = trendDirection(values)

  const habitEntries = (habits || []).filter((h) => isWithinLastNDays(h.date, 7))
  const completed = habitEntries.filter((h) => h.done).length
  const completionRate = habitEntries.length ? completed / habitEntries.length : 0

  const suggestions = []
  if (last7Workouts.length === 0) {
    suggestions.push('Start with 10–15 minutes of movement 3x this week.')
  } else if (direction === 'down') {
    suggestions.push('Your workout minutes are trending down—schedule shorter sessions to rebuild consistency.')
  } else if (direction === 'up') {
    suggestions.push('Great consistency—consider adding a light recovery day to stay sustainable.')
  } else {
    suggestions.push('Maintain your current pace and set a small weekly goal (e.g., +10 total minutes).')
  }

  if (completionRate < 0.5) {
    suggestions.push('Habit completion is below 50%—pick 1 “minimum viable habit” and make it easy to win daily.')
  } else {
    suggestions.push('Habits look steady—keep the cues consistent (same time/place).')
  }

  return {
    title: 'Fitness coaching insights (non-medical)',
    bullets: suggestions,
    stats: {
      workoutsLast7Days: last7Workouts.length,
      habitCompletionRate: completionRate,
    },
  }
}

export function nutritionInsights({ meals, waterLogs }) {
  const last7Meals = (meals || []).filter((m) => isWithinLastNDays(m.date, 7))
  const calories = last7Meals.map((m) => Number(m.calories || 0))
  const avgCalories = calories.length ? calories.reduce((a, b) => a + b, 0) / calories.length : 0

  const last7Water = (waterLogs || []).filter((w) => isWithinLastNDays(w.date, 7))
  const waterByDay = new Map()
  for (const w of last7Water) {
    waterByDay.set(w.date, (waterByDay.get(w.date) || 0) + Number(w.ml || 0))
  }

  const days = Array.from({ length: 7 }, (_, i) => daysAgoIsoDate(6 - i))
  const waterValues = days.map((d) => waterByDay.get(d) || 0)
  const waterTrend = trendDirection(waterValues)

  const suggestions = []
  if (last7Meals.length === 0) {
    suggestions.push('Log at least one meal per day for a week to build awareness.')
  } else {
    suggestions.push(`Average logged calories per meal: ${Math.round(avgCalories)} (awareness only; not medical guidance).`)
  }

  if (waterValues.every((v) => v === 0)) {
    suggestions.push('Start tracking water—try adding one glass after waking up.')
  } else if (waterTrend === 'down') {
    suggestions.push('Hydration is trending down—set a reminder for mid-morning and mid-afternoon water breaks.')
  } else {
    suggestions.push('Keep hydration steady—pair water with routine events (after calls, after meals).')
  }

  return {
    title: 'Nutrition planning insights (non-medical)',
    bullets: suggestions,
    stats: {
      mealsLast7Days: last7Meals.length,
      waterTrend,
    },
  }
}

export function mentalInsights({ moodLogs, journalEntries }) {
  const last7 = (moodLogs || []).filter((m) => isWithinLastNDays(m.date, 7))
  const moodValues = last7.map((m) => Number(m.mood || 0))
  const stressValues = last7.map((m) => Number(m.stress || 0))
  const avgMood = moodValues.length ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : 0
  const avgStress = stressValues.length ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length : 0

  const suggestions = []
  if (!last7.length) {
    suggestions.push('Log mood + stress once per day for 7 days to detect patterns.')
  } else {
    if (avgMood < 4) suggestions.push('Mood has been low—try a short walk, sunlight, or a 5-minute breathing break.')
    if (avgStress > 7) suggestions.push('Stress has been high—schedule a short decompression block (music, stretch, breathing).')
    if (suggestions.length === 0) suggestions.push('Mood and stress look stable—keep your current routine and protect sleep.')
  }

  const journalLast7 = (journalEntries || []).filter((j) => isWithinLastNDays(j.date, 7))
  if (journalLast7.length === 0) {
    suggestions.push('Try a 2-minute journal prompt: “What drained me today? What helped me today?”')
  }

  return {
    title: 'Mental wellness insights (non-clinical)',
    bullets: suggestions,
    stats: {
      avgMood: Number.isFinite(avgMood) ? avgMood : 0,
      avgStress: Number.isFinite(avgStress) ? avgStress : 0,
    },
  }
}

export function chronicSupportInsights({ symptoms, reminders }) {
  const last7Symptoms = (symptoms || []).filter((s) => isWithinLastNDays(s.date, 7))
  const severity = last7Symptoms.map((s) => Number(s.severity || 0))
  const avgSeverity = severity.length ? severity.reduce((a, b) => a + b, 0) / severity.length : 0

  const activeReminders = (reminders || []).filter((r) => r.active)

  const suggestions = []
  if (last7Symptoms.length === 0) {
    suggestions.push('Track symptoms daily for 7 days to spot possible lifestyle correlations (sleep, food, stress).')
  } else if (avgSeverity >= 7) {
    suggestions.push('Symptoms have been intense—consider noting triggers and discussing patterns with a qualified professional.')
  } else {
    suggestions.push('Keep tracking triggers (sleep, hydration, activity) alongside symptoms to learn patterns.')
  }

  if (activeReminders.length === 0) {
    suggestions.push('If you use reminders, add a simple routine reminder to support consistency (non-prescriptive).')
  } else {
    suggestions.push('Reminders are active—mark completions to keep your routine visible.')
  }

  return {
    title: 'Chronic condition support insights (non-diagnostic)',
    bullets: suggestions,
    stats: {
      symptomsLast7Days: last7Symptoms.length,
      avgSeverity: Number.isFinite(avgSeverity) ? avgSeverity : 0,
      activeReminders: activeReminders.length,
    },
  }
}
