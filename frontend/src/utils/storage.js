export function loadJson(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))

  // In-tab notification (the native 'storage' event does not fire in the same tab)
  // Used to refresh dashboard KPIs immediately after edits.
  try {
    window.dispatchEvent(new CustomEvent('healthyfy:storage', { detail: { key } }))
  } catch {
    // ignore
  }
}

export function scopedKey(userId, name) {
  return `healthyfy:v1:${userId}:${name}`
}
