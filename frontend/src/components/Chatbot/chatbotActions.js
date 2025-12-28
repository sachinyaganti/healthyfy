import { exportFinalSetupPdf } from '../../utils/pdfExport.js'
import { appendUserCollectionItem, loadUserCollection, saveUserCollection } from '../../data/wellnessStorage.js'
import { fitnessInsights, nutritionInsights, mentalInsights, chronicSupportInsights } from '../../utils/insights.js'
import { makeId } from '../../utils/id.js'
import { todayIsoDate } from '../../utils/dates.js'

const ROUTES_BY_DOMAIN = {
  dashboard: '/app/dashboard',
  fitness: '/app/fitness',
  nutrition: '/app/nutrition',
  mental: '/app/mental',
  chronic: '/app/chronic',
  login: '/login',
  register: '/register',
}

export function canExecuteAction({ pending, user }) {
  if (!pending?.intent) return { ok: false, reason: 'No action.' }

  // All app-changing actions require a logged-in user in this prototype.
  const requiresUser = !['fill_login', 'fill_register', 'navigate'].includes(pending.intent)
  if (requiresUser && !user?.id) {
    return { ok: false, reason: 'Please login first so I can access your local data.' }
  }

  if (pending.intent === 'export_pdf') {
    const d = pending.slots?.domain
    if (!['fitness', 'nutrition', 'mental', 'chronic'].includes(d)) {
      return { ok: false, reason: 'Please choose Fitness, Nutrition, Mental, or Chronic.' }
    }
  }

  if (pending.intent === 'add_workout') {
    if (!pending.slots?.date || !pending.slots?.type || pending.slots?.minutes == null) {
      return { ok: false, reason: 'Missing workout details.' }
    }
  }

  if (pending.intent === 'add_water') {
    if (!pending.slots?.date || pending.slots?.ml == null) return { ok: false, reason: 'Missing water details.' }
  }

  if (pending.intent === 'add_meal') {
    if (!pending.slots?.date || !pending.slots?.mealType || pending.slots?.calories == null) {
      return { ok: false, reason: 'Missing meal details.' }
    }
  }

  if (pending.intent === 'add_mood') {
    if (!pending.slots?.date || pending.slots?.mood == null || pending.slots?.stress == null) {
      return { ok: false, reason: 'Missing mood details.' }
    }
  }

  if (pending.intent === 'add_journal') {
    if (!pending.slots?.date || !pending.slots?.text) return { ok: false, reason: 'Missing journal details.' }
  }

  if (pending.intent === 'add_symptom') {
    if (!pending.slots?.date || !pending.slots?.symptom || pending.slots?.severity == null) {
      return { ok: false, reason: 'Missing symptom details.' }
    }
  }

  if (pending.intent === 'add_reminder') {
    if (!pending.slots?.label || !pending.slots?.time || pending.slots?.active == null) {
      return { ok: false, reason: 'Missing reminder details.' }
    }
  }

  if (pending.intent === 'toggle_reminder' || pending.intent === 'mark_reminder_done') {
    if (!pending.slots?.label) return { ok: false, reason: 'Which reminder label should I use?' }
  }

  return { ok: true }
}

export async function executeAction({ pending, navigate, user, getVisibleRoute }) {
  if (!pending?.intent) return { ok: false, message: 'Nothing to do.' }

  if (pending.intent === 'navigate') {
    const domain = pending.slots?.domain
    const route = ROUTES_BY_DOMAIN[domain] || ROUTES_BY_DOMAIN.dashboard
    navigate(route)
    return { ok: true, message: `Opened ${titleForDomain(domain)}.` }
  }

  if (pending.intent === 'export_pdf') {
    const domain = pending.slots?.domain
    const route = getVisibleRoute?.() || ''

    // Allow export even if not on that page.
    exportDomainPdf({ domain, user })

    const onSamePage = route.startsWith(ROUTES_BY_DOMAIN[domain] || '')
    return {
      ok: true,
      message: onSamePage
        ? `Export started for ${titleForDomain(domain)}.`
        : `Export started for ${titleForDomain(domain)}. (You don’t need to be on that page.)`,
    }
  }

  if (pending.intent === 'add_workout') {
    appendUserCollectionItem(user.id, 'fitness:workouts', {
      id: makeId('workout'),
      date: pending.slots.date,
      minutes: Number(pending.slots.minutes || 0),
      type: String(pending.slots.type || 'Workout'),
      intensity: 'Moderate',
      createdAt: new Date().toISOString(),
      meta: { source: 'ai-assistant' },
    })
    return { ok: true, message: 'Workout added.' }
  }

  if (pending.intent === 'add_water') {
    appendUserCollectionItem(user.id, 'nutrition:water', {
      id: makeId('water'),
      date: pending.slots.date,
      ml: Number(pending.slots.ml || 0),
      createdAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Water log added.' }
  }

  if (pending.intent === 'add_meal') {
    appendUserCollectionItem(user.id, 'nutrition:meals', {
      id: makeId('meal'),
      date: pending.slots.date,
      mealType: pending.slots.mealType,
      calories: Number(pending.slots.calories || 0),
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: pending.slots.notes ? String(pending.slots.notes) : '',
      source: 'ai-assistant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Meal added.' }
  }

  if (pending.intent === 'add_mood') {
    appendUserCollectionItem(user.id, 'mental:mood', {
      id: makeId('mood'),
      date: pending.slots.date,
      mood: Number(pending.slots.mood || 0),
      stress: Number(pending.slots.stress || 0),
      notes: pending.slots.notes ? String(pending.slots.notes) : '',
      createdAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Mood log added.' }
  }

  if (pending.intent === 'add_journal') {
    appendUserCollectionItem(user.id, 'mental:journals', {
      id: makeId('journal'),
      date: pending.slots.date,
      text: String(pending.slots.text),
      createdAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Journal entry saved.' }
  }

  if (pending.intent === 'add_symptom') {
    appendUserCollectionItem(user.id, 'chronic:symptoms', {
      id: makeId('symptom'),
      date: pending.slots.date,
      symptom: String(pending.slots.symptom),
      severity: Number(pending.slots.severity || 0),
      notes: pending.slots.notes ? String(pending.slots.notes) : '',
      createdAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Symptom log added.' }
  }

  if (pending.intent === 'add_reminder') {
    appendUserCollectionItem(user.id, 'chronic:reminders', {
      id: makeId('reminder'),
      label: String(pending.slots.label),
      time: String(pending.slots.time),
      active: Boolean(pending.slots.active),
      completions: [],
      createdAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Reminder created.' }
  }

  if (pending.intent === 'toggle_reminder') {
    const reminders = loadUserCollection(user.id, 'chronic:reminders')
    const match = findReminderByLabel(reminders, pending.slots.label)
    if (!match) return { ok: false, message: 'I could not find a matching reminder label.' }
    const next = reminders.map((r) => (r.id === match.id ? { ...r, active: !r.active } : r))
    saveUserCollection(user.id, 'chronic:reminders', next)
    return { ok: true, message: `Reminder “${match.label}” is now ${match.active ? 'inactive' : 'active'}.` }
  }

  if (pending.intent === 'mark_reminder_done') {
    const reminders = loadUserCollection(user.id, 'chronic:reminders')
    const match = findReminderByLabel(reminders, pending.slots.label)
    if (!match) return { ok: false, message: 'I could not find a matching reminder label.' }
    const today = todayIsoDate()
    const next = reminders.map((r) => {
      if (r.id !== match.id) return r
      const completions = Array.isArray(r.completions) ? r.completions : []
      if (completions.includes(today)) return r
      return { ...r, completions: [today, ...completions] }
    })
    saveUserCollection(user.id, 'chronic:reminders', next)
    return { ok: true, message: `Marked “${match.label}” done for today.` }
  }

  if (pending.intent === 'fill_login') {
    return fillVisibleForm({ kind: 'login' })
  }

  if (pending.intent === 'fill_register') {
    return fillVisibleForm({ kind: 'register' })
  }

  return { ok: false, message: 'Action not supported yet.' }
}

function findReminderByLabel(reminders, label) {
  const want = String(label || '').trim().toLowerCase()
  if (!want) return null
  const items = Array.isArray(reminders) ? reminders : []
  // Exact match first
  const exact = items.find((r) => String(r.label || '').trim().toLowerCase() === want)
  if (exact) return exact
  // Partial match
  const partial = items.find((r) => String(r.label || '').toLowerCase().includes(want))
  return partial || null
}

function titleForDomain(domain) {
  if (!domain) return 'Dashboard'
  return String(domain).slice(0, 1).toUpperCase() + String(domain).slice(1)
}

function exportDomainPdf({ domain, user }) {
  if (domain === 'fitness') {
    const workouts = loadUserCollection(user.id, 'fitness:workouts')
    const habits = loadUserCollection(user.id, 'fitness:habits')
    const insight = fitnessInsights({ workouts, habits })

    exportFinalSetupPdf({
      user,
      domainTitle: 'Fitness',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [`Workouts logged: ${workouts.length}`, `Habit check-ins: ${habits.length}`],
        },
        { title: 'Trends & insights (rule-based)', lines: insight.bullets },
        {
          title: 'Recent workouts (up to 10)',
          lines: workouts.slice(0, 10).length
            ? workouts.slice(0, 10).map((w) => `${w.date} — ${w.type || 'Workout'} — ${w.durationMin || 0} min`)
            : ['No workouts logged yet.'],
        },
        {
          title: 'Recent habit check-ins (up to 10)',
          lines: habits.slice(0, 10).length
            ? habits.slice(0, 10).map((h) => `${h.date} — ${h.habit || 'Habit'} — ${h.status || 'done'}`)
            : ['No habit check-ins yet.'],
        },
      ],
    })
    return
  }

  if (domain === 'nutrition') {
    const meals = loadUserCollection(user.id, 'nutrition:meals')
    const waterLogs = loadUserCollection(user.id, 'nutrition:water')
    const insight = nutritionInsights({ meals, waterLogs })

    exportFinalSetupPdf({
      user,
      domainTitle: 'Nutrition',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [`Meals logged: ${meals.length}`, `Water logs: ${waterLogs.length}`],
        },
        { title: 'Trends & insights (rule-based)', lines: insight.bullets },
        {
          title: 'Recent meals (up to 10)',
          lines: meals.slice(0, 10).length
            ? meals.slice(0, 10).map((m) => `${m.date} — ${m.mealType || 'Meal'} — ${m.calories || 0} cal${m.notes ? ` — ${m.notes}` : ''}`)
            : ['No meals logged yet.'],
        },
        {
          title: 'Recent water logs (up to 10)',
          lines: waterLogs.slice(0, 10).length
            ? waterLogs.slice(0, 10).map((w) => `${w.date} — ${w.ml} ml`)
            : ['No water logs yet.'],
        },
      ],
    })
    return
  }

  if (domain === 'mental') {
    const moodLogs = loadUserCollection(user.id, 'mental:mood')
    const journalEntries = loadUserCollection(user.id, 'mental:journals')
    const insight = mentalInsights({ moodLogs, journalEntries })

    exportFinalSetupPdf({
      user,
      domainTitle: 'Mental',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [`Mood logs: ${moodLogs.length}`, `Journal entries: ${journalEntries.length}`],
        },
        { title: 'Trends & insights (rule-based)', lines: insight.bullets },
        {
          title: 'Recent mood logs (up to 10)',
          lines: moodLogs.slice(0, 10).length
            ? moodLogs.slice(0, 10).map((m) => `${m.date} — Mood ${m.mood}/10${m.notes ? ` — ${m.notes}` : ''}`)
            : ['No mood logs yet.'],
        },
        {
          title: 'Recent journal entries (up to 10)',
          lines: journalEntries.slice(0, 10).length
            ? journalEntries.slice(0, 10).map((j) => `${j.date} — ${String(j.text || '').slice(0, 120)}${String(j.text || '').length > 120 ? '…' : ''}`)
            : ['No journal entries yet.'],
        },
      ],
    })
    return
  }

  if (domain === 'chronic') {
    const symptoms = loadUserCollection(user.id, 'chronic:symptoms')
    const reminders = loadUserCollection(user.id, 'chronic:reminders')
    const insight = chronicSupportInsights({ symptoms, reminders })

    exportFinalSetupPdf({
      user,
      domainTitle: 'Chronic',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [`Symptoms logged: ${symptoms.length}`, `Reminders: ${reminders.length}`],
        },
        { title: 'Trends & insights (rule-based)', lines: insight.bullets },
        {
          title: 'Recent symptoms (up to 10)',
          lines: symptoms.slice(0, 10).length
            ? symptoms.slice(0, 10).map((s) => `${s.date} — ${s.symptom || 'Symptom'} — Severity ${s.severity || 0}/10`)
            : ['No symptoms logged yet.'],
        },
        {
          title: 'Reminders (up to 10)',
          lines: reminders.slice(0, 10).length
            ? reminders.slice(0, 10).map((r) => `${r.title || 'Reminder'} — ${r.time || ''}${r.enabled === false ? ' (off)' : ''}`)
            : ['No reminders yet.'],
        },
      ],
    })
    return
  }
}

function parseKeyValues(text) {
  const out = {}
  const raw = String(text || '')
  const parts = raw.split(',')
  for (const p of parts) {
    const [k, ...rest] = p.split(':')
    if (!k || !rest.length) continue
    const key = k.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (!value) continue
    out[key] = value
  }
  return out
}

function setNativeValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(el.__proto__, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function fillVisibleForm({ kind }) {
  const active = document.activeElement
  const lastUserText = window.__healthyfyLastChatUserText || ''
  const kv = parseKeyValues(lastUserText)

  // If the user confirmed, they still need to provide the fields in the *next* message.
  // We detect that case and guide them.
  const missingAny =
    (kind === 'login' && (!kv.email || !kv.password)) ||
    (kind === 'register' && (!kv.name || !kv.email || !kv.password))

  if (missingAny) {
    return {
      ok: false,
      message:
        kind === 'login'
          ? 'Reply with “email: you@x.com, password: 123456” and I’ll fill the fields.'
          : 'Reply with “name: Sam, email: sam@x.com, password: 123456” and I’ll fill the fields.',
    }
  }

  const emailInput = document.querySelector('input[name="email"], input[placeholder*="@" i]')
  const passwordInput = document.querySelector('input[name="password"], input[type="password"]')
  const nameInput = document.querySelector('input[name="name"], input[placeholder*="name" i]')

  if (kind === 'login') {
    if (!emailInput || !passwordInput) {
      return { ok: false, message: 'I can’t find the Login form fields on this page.' }
    }
    setNativeValue(emailInput, kv.email)
    setNativeValue(passwordInput, kv.password)
    if (active && typeof active.focus === 'function') active.focus()
    return { ok: true, message: 'Filled the Login form fields. Review them, then click “Sign in” when ready.' }
  }

  if (kind === 'register') {
    if (!nameInput || !emailInput || !passwordInput) {
      return { ok: false, message: 'I can’t find the Register form fields on this page.' }
    }
    setNativeValue(nameInput, kv.name)
    setNativeValue(emailInput, kv.email)
    setNativeValue(passwordInput, kv.password)
    if (active && typeof active.focus === 'function') active.focus()
    return { ok: true, message: 'Filled the Register form fields. Review them, then click “Create account” when ready.' }
  }

  return { ok: false, message: 'Unknown form type.' }
}
