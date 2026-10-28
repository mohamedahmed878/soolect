import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, TOKEN_KEY } from './api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    const out = () => setAdmin(null)
    window.addEventListener('admin-logout', out)
    return () => window.removeEventListener('admin-logout', out)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    api.me()
      .then((u) => { if (u.role === 'admin') setAdmin(u); else localStorage.removeItem(TOKEN_KEY) })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login(email, password)
    // Customers use the same login endpoint. Only the admin account may enter here.
    if (user?.role !== 'admin') throw new Error('This account is not an admin account')
    localStorage.setItem(TOKEN_KEY, token)
    setAdmin(user)
  }, [])

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setAdmin(null) }, [])

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>
}
