import { loadJson, saveJson } from '../utils/storage.js'
import { makeId } from '../utils/id.js'

// Prototype-only auth:
// - Users and sessions are stored in localStorage.
// - Passwords are hashed (SHA-256) with a per-user salt.
// This is NOT production-grade security and will be replaced by JWT auth in Step 2.

const USERS_KEY = 'healthyfy:v1:users'
const SESSION_KEY = 'healthyfy:v1:session'

async function sha256(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function getSession() {
  const session = loadJson(SESSION_KEY, null)
  if (!session) return null
  if (!session.expiresAt || Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return session
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getUserById(userId) {
  const users = loadJson(USERS_KEY, [])
  return users.find((u) => u.id === userId) || null
}

export async function registerUser({ name, email, password }) {
  const users = loadJson(USERS_KEY, [])
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Email is required')
  if (users.some((u) => u.email === normalizedEmail)) throw new Error('Email already registered')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')

  const salt = makeId('salt')
  const passwordHash = await sha256(`${salt}:${password}`)

  const user = {
    id: makeId('user'),
    name: String(name || 'User').trim() || 'User',
    email: normalizedEmail,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  saveJson(USERS_KEY, users)

  return { id: user.id, name: user.name, email: user.email }
}

export async function loginUser({ email, password }) {
  const users = loadJson(USERS_KEY, [])
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = users.find((u) => u.email === normalizedEmail)
  if (!user) throw new Error('Invalid email or password')

  const attemptedHash = await sha256(`${user.salt}:${password}`)
  if (attemptedHash !== user.passwordHash) throw new Error('Invalid email or password')

  const session = {
    token: makeId('session'),
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  }

  saveJson(SESSION_KEY, session)

  return {
    session,
    user: { id: user.id, name: user.name, email: user.email },
  }
}
