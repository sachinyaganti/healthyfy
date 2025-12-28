import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSession, getUserById, loginUser, logout as storageLogout, registerUser } from './authStorage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      setUser(null)
      setReady(true)
      return
    }

    const u = getUserById(session.userId)
    if (!u) {
      storageLogout()
      setUser(null)
      setReady(true)
      return
    }

    setUser({ id: u.id, name: u.name, email: u.email })
    setReady(true)
  }, [])

  const api = useMemo(() => {
    return {
      ready,
      user,
      async register({ name, email, password }) {
        const created = await registerUser({ name, email, password })
        return created
      },
      async login({ email, password }) {
        const result = await loginUser({ email, password })
        setUser(result.user)
        return result
      },
      logout() {
        storageLogout()
        setUser(null)
      },
    }
  }, [ready, user])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
