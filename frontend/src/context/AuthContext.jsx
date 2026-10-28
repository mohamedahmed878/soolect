import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('soalect_token'))

  useEffect(() => {
    if (!localStorage.getItem('soalect_token')) return
    api.me().then(setUser).catch(() => localStorage.removeItem('soalect_token')).finally(() => setLoading(false))
  }, [])

  const finish = ({ token, user }) => { localStorage.setItem('soalect_token', token); setUser(user); return user }
  const login = useCallback((d) => api.login(d).then(finish), [])
  const register = useCallback((d) => api.register(d).then(finish), [])
  const logout = useCallback(() => { localStorage.removeItem('soalect_token'); setUser(null) }, [])

  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>
}
