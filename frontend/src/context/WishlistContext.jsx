import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const WishCtx = createContext(null)
export const useWishlist = () => useContext(WishCtx)

const KEY = 'soalect_wishlist'

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(ids)) }, [ids])

  const has = useCallback((id) => ids.includes(id), [ids])
  const toggle = useCallback((id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])), [])

  return <WishCtx.Provider value={{ ids, has, toggle, count: ids.length }}>{children}</WishCtx.Provider>
}
