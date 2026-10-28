import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Saved addresses live in localStorage per user until the backend exposes /api/addresses.
export default function useAddresses() {
  const { user } = useAuth()
  const key = `soalect_addresses_${user?._id || 'guest'}`
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
  const [list, setList] = useState(read)
  useEffect(() => { setList(read()) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((next) => { setList(next); localStorage.setItem(key, JSON.stringify(next)) }, [key])

  const save = useCallback((addr) => {
    const cur = read()
    const id = addr._id || 'a' + Date.now()
    let next = addr._id ? cur.map((a) => (a._id === id ? { ...a, ...addr } : a)) : [...cur, { ...addr, _id: id }]
    if (addr.isDefault) next = next.map((a) => ({ ...a, isDefault: a._id === id }))
    else if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true }
    persist(next)
  }, [persist]) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = useCallback((id) => {
    let next = read().filter((a) => a._id !== id)
    if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true }
    persist(next)
  }, [persist]) // eslint-disable-line react-hooks/exhaustive-deps

  const setDefault = useCallback((id) => persist(read().map((a) => ({ ...a, isDefault: a._id === id }))), [persist]) // eslint-disable-line react-hooks/exhaustive-deps

  return { list, save, remove, setDefault }
}
