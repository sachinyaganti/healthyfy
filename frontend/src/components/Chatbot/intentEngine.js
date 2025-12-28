const DOMAIN_SYNONYMS = {
  dashboard: ['dashboard', 'home', 'main', 'overview', 'unified'],
  fitness: ['fitness', 'workout', 'workouts', 'exercise', 'training', 'habit', 'habits'],
  nutrition: ['nutrition', 'food', 'meal', 'meals', 'diet', 'hydration', 'water'],
  mental: ['mental', 'stress', 'mood', 'journal', 'journaling', 'calm', 'mind'],
  chronic: ['chronic', 'symptom', 'symptoms', 'reminder', 'reminders', 'condition'],
  login: ['login', 'sign in', 'signin', 'log in'],
  register: ['register', 'sign up', 'signup', 'create account'],
}

const INTENT_DEFS = {
  navigate: {
    required: ['domain'],
  },
  export_pdf: {
    required: ['domain'],
  },

  add_workout: {
    required: ['date', 'type', 'minutes'],
  },
  add_meal: {
    required: ['date', 'mealType', 'calories'],
  },
  add_water: {
    required: ['date', 'ml'],
  },
  add_mood: {
    required: ['date', 'mood', 'stress'],
  },
  add_journal: {
    required: ['date', 'text'],
  },
  add_symptom: {
    required: ['date', 'symptom', 'severity'],
  },
  add_reminder: {
    required: ['label', 'time', 'active'],
  },

  toggle_reminder: {
    required: ['label'],
  },
  mark_reminder_done: {
    required: ['label'],
  },
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
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

function extractIsoDate(text) {
  const t = normalize(text)
  if (t === 'today') return isoToday()
  if (t === 'yesterday') return isoDaysFromToday(-1)

  const m = String(text || '').match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (m?.[1]) return m[1]
  return null
}

function isoToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isoDaysFromToday(deltaDays) {
  const d = new Date()
  d.setDate(d.getDate() + deltaDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseNumber(text) {
  const raw = String(text || '')
  const m = raw.match(/-?\d+(?:\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

function parseTimeHHMM(text) {
  const m = String(text || '').match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)
  if (!m) return null
  return `${m[1]}:${m[2]}`
}

function parseBoolean(text) {
  const t = normalize(text)
  if (['true', 'on', 'active', 'enabled', 'yes', 'y'].includes(t)) return true
  if (['false', 'off', 'inactive', 'disabled', 'no', 'n'].includes(t)) return false
  return null
}

function detectDomain(text) {
  const t = normalize(text)
  for (const [domain, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
    for (const s of synonyms) {
      if (t.includes(s)) return domain
    }
  }
  return null
}

function looksLikeYes(text) {
  const t = normalize(text)
  return ['yes', 'y', 'sure', 'ok', 'okay', 'confirm', 'do it', 'go ahead', 'please'].includes(t)
}

function looksLikeNo(text) {
  const t = normalize(text)
  return ['no', 'n', 'nope', 'cancel', 'stop', 'not now', 'never mind', 'nevermind'].includes(t)
}

export function classifyUserMessage(text) {
  const t = normalize(text)
  const kv = parseKeyValues(text)

  if (!t) return { intent: 'smalltalk', entities: {} }

  if (looksLikeYes(t)) return { intent: 'confirm_yes', entities: {} }
  if (looksLikeNo(t)) return { intent: 'confirm_no', entities: {} }

  // Export / download
  if (/(export|download)\b/.test(t) && /\b(pdf)\b/.test(t)) {
    return { intent: 'export_pdf', entities: { domain: detectDomain(t) } }
  }

  // Add / log entries
  if (/(add|log|track|record)\b/.test(t) && (t.includes('workout') || t.includes('exercise') || t.includes('training'))) {
    return {
      intent: 'add_workout',
      entities: {
        date: extractIsoDate(t) || extractIsoDate(kv.date),
        type: kv.type || kv.workout || null,
        minutes: parseNumber(kv.minutes) ?? parseNumber(t),
      },
    }
  }

  if (/(add|log|track|record)\b/.test(t) && (t.includes('water') || t.includes('hydration'))) {
    return {
      intent: 'add_water',
      entities: {
        date: extractIsoDate(t) || extractIsoDate(kv.date),
        ml: parseNumber(kv.ml) ?? parseNumber(kv.amount) ?? parseNumber(t),
      },
    }
  }

  if (/(add|log|track|record)\b/.test(t) && (t.includes('meal') || t.includes('food') || t.includes('breakfast') || t.includes('lunch') || t.includes('dinner'))) {
    return {
      intent: 'add_meal',
      entities: {
        date: extractIsoDate(t) || extractIsoDate(kv.date),
        mealType: kv.mealtype || kv.meal || inferMealType(t),
        calories: parseNumber(kv.calories) ?? parseNumber(kv.cal) ?? null,
        notes: kv.notes || kv.name || null,
      },
    }
  }

  if (/(add|log|track|record)\b/.test(t) && (t.includes('mood') || t.includes('stress'))) {
    return {
      intent: 'add_mood',
      entities: {
        date: extractIsoDate(t) || extractIsoDate(kv.date),
        mood: parseNumber(kv.mood),
        stress: parseNumber(kv.stress),
        notes: kv.notes || null,
      },
    }
  }

  if (/(add|log|track|record)\b/.test(t) && (t.includes('journal') || t.includes('journaling'))) {
    return {
      intent: 'add_journal',
      entities: {
        date: extractIsoDate(t) || extractIsoDate(kv.date),
        text: kv.text || kv.entry || null,
      },
    }
  }

  if (/(add|log|track|record)\b/.test(t) && (t.includes('symptom') || t.includes('severity'))) {
    return {
      intent: 'add_symptom',
      entities: {
        date: extractIsoDate(t) || extractIsoDate(kv.date),
        symptom: kv.symptom || kv.name || null,
        severity: parseNumber(kv.severity) ?? null,
        notes: kv.notes || null,
      },
    }
  }

  if (/(add|create|set)\b/.test(t) && t.includes('reminder')) {
    return {
      intent: 'add_reminder',
      entities: {
        label: kv.label || kv.title || null,
        time: parseTimeHHMM(kv.time) || parseTimeHHMM(t),
        active: parseBoolean(kv.active) ?? parseBoolean(kv.enabled) ?? true,
      },
    }
  }

  if (/(toggle|turn)\b/.test(t) && t.includes('reminder')) {
    return { intent: 'toggle_reminder', entities: { label: kv.label || kv.title || null } }
  }

  if ((/(done|complete|completed|mark)\b/.test(t) && t.includes('reminder')) || t.includes('mark reminder done')) {
    return { intent: 'mark_reminder_done', entities: { label: kv.label || kv.title || null } }
  }

  // Navigation
  if (/(go to|open|navigate|take me|show me)\b/.test(t)) {
    return { intent: 'navigate', entities: { domain: detectDomain(t) } }
  }

  // Form filling
  if (/\b(fill|enter|type)\b/.test(t) && (t.includes('login') || t.includes('sign in'))) {
    return { intent: 'fill_login', entities: {} }
  }
  if (/\b(fill|enter|type)\b/.test(t) && (t.includes('register') || t.includes('sign up') || t.includes('create account'))) {
    return { intent: 'fill_register', entities: {} }
  }

  // Help / capabilities
  if (/\b(help|what can you do|capabilities|commands)\b/.test(t)) {
    return { intent: 'help', entities: {} }
  }

  // Disclaimer
  if (/\b(disclaimer|medical|diagnose|diagnosis|treatment)\b/.test(t)) {
    return { intent: 'disclaimer', entities: {} }
  }

  // Domain shortcuts
  const domain = detectDomain(t)
  if (domain && ['dashboard', 'fitness', 'nutrition', 'mental', 'chronic', 'login', 'register'].includes(domain)) {
    return { intent: 'navigate', entities: { domain } }
  }

  return { intent: 'smalltalk', entities: {} }
}

export function nextConversationStep(prevState, userText) {
  const classification = classifyUserMessage(userText)

  // If we are waiting for a confirm/cancel response.
  if (prevState?.mode === 'confirming' && prevState?.pending) {
    if (classification.intent === 'confirm_yes') {
      return {
        type: 'execute',
        pending: prevState.pending,
        nextState: { ...prevState, mode: 'idle', pending: null },
      }
    }
    if (classification.intent === 'confirm_no') {
      return {
        type: 'message',
        message: "No problem — cancelled.",
        nextState: { ...prevState, mode: 'idle', pending: null },
      }
    }

    return {
      type: 'message',
      message: 'Please reply with “yes” to confirm or “no” to cancel.',
      nextState: prevState,
    }
  }

  // Slot collection for pending actions (only one slot for MVP).
  if (prevState?.mode === 'collecting' && prevState?.pending) {
    const slotKey = prevState.pending?.missing?.[0]
    const parsed = parseSlotValue(slotKey, userText)
    if (parsed == null || parsed === '') {
      return {
        type: 'message',
        message: promptForSlot(prevState.pending.intent, slotKey),
        nextState: prevState,
      }
    }

    const nextSlots = { ...(prevState.pending.slots || {}), [slotKey]: parsed }
    const nextMissing = (prevState.pending.missing || []).slice(1)
    const nextPending = { ...prevState.pending, slots: nextSlots, missing: nextMissing }

    if (nextMissing.length) {
      return {
        type: 'message',
        message: promptForSlot(nextPending.intent, nextMissing[0]),
        nextState: { ...prevState, mode: 'collecting', pending: nextPending },
      }
    }

    return {
      type: 'message',
      message: confirmTextForPending(nextPending),
      nextState: { ...prevState, mode: 'confirming', pending: nextPending },
    }
  }

  // New intent.
  switch (classification.intent) {
    case 'help': {
      return {
        type: 'message',
        message:
          'I can help you navigate (e.g., “open nutrition”), export a domain PDF (e.g., “export fitness pdf”), and assist with basic form filling on Login/Register. I’ll ask a question if something is missing, then confirm before doing anything.',
        nextState: prevState,
      }
    }

    case 'disclaimer': {
      return {
        type: 'message',
        message:
          'Reminder: I provide wellness and lifestyle support only — not medical advice, diagnosis, or treatment. For medical concerns, please consult a qualified professional.',
        nextState: prevState,
      }
    }

    case 'navigate': {
      const domain = classification.entities.domain
      const pending = {
        intent: 'navigate',
        slots: { domain: domain || null },
        missing: domain ? [] : ['domain'],
      }

      if (pending.missing.length) {
        return {
          type: 'message',
          message: 'Where should I take you: Fitness, Nutrition, Mental, Chronic, or Dashboard?',
          nextState: { ...prevState, mode: 'collecting', pending },
        }
      }

      return {
        type: 'message',
        message: confirmTextForPending(pending),
        nextState: { ...prevState, mode: 'confirming', pending },
      }
    }

    case 'export_pdf': {
      const domain = classification.entities.domain
      const pending = {
        intent: 'export_pdf',
        slots: { domain: domain || null },
        missing: domain ? [] : ['domain'],
      }

      if (pending.missing.length) {
        return {
          type: 'message',
          message: 'Sure — which domain should I export: Fitness, Nutrition, Mental, or Chronic?',
          nextState: { ...prevState, mode: 'collecting', pending },
        }
      }

      return {
        type: 'message',
        message: confirmTextForPending(pending),
        nextState: { ...prevState, mode: 'confirming', pending },
      }
    }

    case 'fill_login': {
      const pending = { intent: 'fill_login', slots: {}, missing: [] }
      return {
        type: 'message',
        message: 'I can fill the visible Login form fields from what you type next (email + password). Reply like: “email: you@x.com, password: 123456”. Want to proceed?',
        nextState: { ...prevState, mode: 'confirming', pending },
      }
    }

    case 'fill_register': {
      const pending = { intent: 'fill_register', slots: {}, missing: [] }
      return {
        type: 'message',
        message: 'I can fill the visible Register form fields (name, email, password). Reply like: “name: Sam, email: sam@x.com, password: 123456”. Want to proceed?',
        nextState: { ...prevState, mode: 'confirming', pending },
      }
    }

    case 'add_workout':
    case 'add_meal':
    case 'add_water':
    case 'add_mood':
    case 'add_journal':
    case 'add_symptom':
    case 'add_reminder':
    case 'toggle_reminder':
    case 'mark_reminder_done': {
      const def = INTENT_DEFS[classification.intent]
      const slots = { ...(classification.entities || {}) }
      const missing = (def?.required || []).filter((k) => slots[k] == null || slots[k] === '')
      const pending = { intent: classification.intent, slots, missing }

      if (missing.length) {
        return {
          type: 'message',
          message: promptForSlot(pending.intent, missing[0]),
          nextState: { ...prevState, mode: 'collecting', pending },
        }
      }

      return {
        type: 'message',
        message: confirmTextForPending(pending),
        nextState: { ...prevState, mode: 'confirming', pending },
      }
    }

    case 'smalltalk':
    default: {
      // Keep it non-medical and helpful.
      const maybeDomain = detectDomain(userText)
      if (maybeDomain && ['fitness', 'nutrition', 'mental', 'chronic'].includes(maybeDomain)) {
        return {
          type: 'message',
          message: `I can help with ${capitalize(maybeDomain)}. Do you want to open it, export its PDF, or ask a question?`,
          nextState: prevState,
        }
      }

      return {
        type: 'message',
        message: "I'm here. Tell me what you want to do in the app (e.g., “open dashboard”, “export nutrition pdf”).",
        nextState: prevState,
      }
    }
  }
}

function capitalize(s) {
  return String(s || '').slice(0, 1).toUpperCase() + String(s || '').slice(1)
}

function confirmTextForPending(pending) {
  if (pending.intent === 'navigate') {
    const d = pending.slots.domain
    return `Confirm: open ${capitalize(d)} now?`
  }
  if (pending.intent === 'export_pdf') {
    const d = pending.slots.domain
    return `Confirm: export your ${capitalize(d)} summary as a PDF now?`
  }
  if (pending.intent === 'add_workout') {
    return `Confirm: add workout “${pending.slots.type}” for ${pending.slots.minutes} minutes on ${pending.slots.date}?`
  }
  if (pending.intent === 'add_water') {
    return `Confirm: log ${pending.slots.ml} ml of water on ${pending.slots.date}?`
  }
  if (pending.intent === 'add_meal') {
    return `Confirm: add ${pending.slots.mealType} with ${pending.slots.calories} calories on ${pending.slots.date}?`
  }
  if (pending.intent === 'add_mood') {
    return `Confirm: log mood ${pending.slots.mood}/10 and stress ${pending.slots.stress}/10 on ${pending.slots.date}?`
  }
  if (pending.intent === 'add_journal') {
    return `Confirm: save this journal entry for ${pending.slots.date}?`
  }
  if (pending.intent === 'add_symptom') {
    return `Confirm: log symptom “${pending.slots.symptom}” severity ${pending.slots.severity}/10 on ${pending.slots.date}?`
  }
  if (pending.intent === 'add_reminder') {
    return `Confirm: create reminder “${pending.slots.label}” at ${pending.slots.time} (${pending.slots.active ? 'active' : 'inactive'})?`
  }
  if (pending.intent === 'toggle_reminder') {
    return `Confirm: toggle reminder “${pending.slots.label}”?`
  }
  if (pending.intent === 'mark_reminder_done') {
    return `Confirm: mark reminder “${pending.slots.label}” done for today?`
  }
  if (pending.intent === 'fill_login') {
    return 'Confirm: I will fill the visible Login form fields (no submission).'
  }
  if (pending.intent === 'fill_register') {
    return 'Confirm: I will fill the visible Register form fields (no submission).'
  }
  return 'Confirm this action?'
}

function inferMealType(text) {
  const t = normalize(text)
  if (t.includes('breakfast')) return 'Breakfast'
  if (t.includes('lunch')) return 'Lunch'
  if (t.includes('dinner')) return 'Dinner'
  if (t.includes('snack')) return 'Snack'
  return null
}

function promptForSlot(intent, slotKey) {
  if (slotKey === 'domain') return 'Which area: Fitness, Nutrition, Mental, Chronic, or Dashboard?'
  if (slotKey === 'date') return 'What date? Reply like “today” or “2025-12-27”.'
  if (slotKey === 'type') return 'What workout type? (e.g., “Running”, “Yoga”, “Strength”)'
  if (slotKey === 'minutes') return 'How many minutes? (e.g., “30”)'
  if (slotKey === 'ml') return 'How much water in ml? (e.g., “500”)'
  if (slotKey === 'mealType') return 'Which meal type? (Breakfast, Lunch, Dinner, Snack)'
  if (slotKey === 'calories') return 'How many calories? (number)'
  if (slotKey === 'mood') return 'Mood from 0–10? (number)'
  if (slotKey === 'stress') return 'Stress from 0–10? (number)'
  if (slotKey === 'text') return 'What should the journal entry say?'
  if (slotKey === 'symptom') return 'Which symptom name? (e.g., “Headache”)'
  if (slotKey === 'severity') return 'Severity from 0–10? (number)'
  if (slotKey === 'label') return 'What should the reminder label be?'
  if (slotKey === 'time') return 'What time? (HH:MM, 24h)'
  if (slotKey === 'active') return 'Should it be active? (yes/no)'
  return `Please provide ${slotKey}.`
}

function parseSlotValue(slotKey, userText) {
  if (!slotKey) return null
  if (slotKey === 'domain') {
    const domain = detectDomain(userText)
    return domain && ['fitness', 'nutrition', 'mental', 'chronic', 'dashboard'].includes(domain) ? domain : null
  }
  if (slotKey === 'date') return extractIsoDate(userText)
  if (slotKey === 'minutes') {
    const n = parseNumber(userText)
    return n == null ? null : Math.max(0, Math.round(n))
  }
  if (slotKey === 'ml') {
    const n = parseNumber(userText)
    return n == null ? null : Math.max(0, Math.round(n))
  }
  if (slotKey === 'calories') {
    const n = parseNumber(userText)
    return n == null ? null : Math.max(0, Math.round(n))
  }
  if (slotKey === 'mood' || slotKey === 'stress' || slotKey === 'severity') {
    const n = parseNumber(userText)
    if (n == null) return null
    return Math.max(0, Math.min(10, Math.round(n)))
  }
  if (slotKey === 'time') return parseTimeHHMM(userText)
  if (slotKey === 'active') {
    const b = parseBoolean(userText)
    return b == null ? null : b
  }
  if (slotKey === 'mealType') {
    const t = normalize(userText)
    if (t === 'breakfast') return 'Breakfast'
    if (t === 'lunch') return 'Lunch'
    if (t === 'dinner') return 'Dinner'
    if (t === 'snack') return 'Snack'
    return null
  }
  if (slotKey === 'type' || slotKey === 'symptom' || slotKey === 'label') {
    const v = String(userText || '').trim()
    return v ? v : null
  }
  if (slotKey === 'text') {
    const v = String(userText || '').trim()
    return v ? v : null
  }
  return null
}
