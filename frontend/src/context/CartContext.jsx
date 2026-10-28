import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

export const FREE_SHIPPING_OVER = 1000
export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', days: '3-5 days', price: 50 },
  { id: 'express', label: 'Express Shipping', days: '1-2 days', price: 100 },
  { id: 'free', label: 'Free Shipping', days: `Over ${FREE_SHIPPING_OVER} EGP`, price: 0, minSubtotal: FREE_SHIPPING_OVER },
]

// `subtotal` is before any coupon. Mirrors backend/services/pricing.js.
export const shippingFor = (id, subtotal) => (id === 'express' ? 100 : id === 'free' ? 0 : subtotal >= FREE_SHIPPING_OVER ? 0 : 50)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('soalect_cart')) || [] } catch { return [] } })
  const [discount, setDiscount] = useState(null) // { code, amount }
  useEffect(() => { localStorage.setItem('soalect_cart', JSON.stringify(items)) }, [items])

  const keyOf = (i) => `${i.productId}|${i.color}|${i.size}`
  const add = (item) => setItems((prev) => {
    const hit = prev.find((p) => keyOf(p) === keyOf(item))
    return hit ? prev.map((p) => (keyOf(p) === keyOf(item) ? { ...p, qty: p.qty + (item.qty || 1) } : p)) : [...prev, { ...item, qty: item.qty || 1 }]
  })
  const setQty = (item, qty) => setItems((prev) => prev.map((p) => (keyOf(p) === keyOf(item) ? { ...p, qty: Math.max(1, qty) } : p)))
  const remove = (item) => setItems((prev) => prev.filter((p) => keyOf(p) !== keyOf(item)))
  const clear = () => { setItems([]); setDiscount(null) }

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    const count = items.reduce((s, i) => s + i.qty, 0)
    return { subtotal, count }
  }, [items])

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, discount, setDiscount, keyOf, ...totals }}>
      {children}
    </CartCtx.Provider>
  )
}
