import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Garment from '../components/Garment'
import Icon from '../components/Icon'
import { PageBar } from '../components/Layout'
import { useCart, SHIPPING_METHODS } from '../context/CartContext'

export const CODES = { SOALECT10: 0.1 } // temporary: real validation will be done by the backend

export default function Cart() {
  const { items, setQty, remove, subtotal, discount, setDiscount, count } = useCart()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : SHIPPING_METHODS[0].price
  const total = subtotal - (discount?.amount || 0) + shipping

  const apply = () => {
    const rate = CODES[code.trim().toUpperCase()]
    if (!rate) { setDiscount(null); return setMsg('Invalid code') }
    setDiscount({ code: code.trim().toUpperCase(), amount: Math.round(subtotal * rate) }); setMsg('Code applied')
  }

  if (!items.length) return (
    <><PageBar title="Your Cart" back={false} /><div className="empty"><Icon name="bag" size={42} /><p>Your cart is empty.</p><Link to="/shop" className="btn btn-dark">Browse products</Link></div></>
  )

  return (
    <>
      <PageBar title={`Your Cart (${count})`} back={false} />
      <div className="cart-grid">
        <ul className="cart-list">
          {items.map((i, n) => (
            <li key={`${i.productId}${i.color}${i.size}`} className="cart-item" style={{ '--i': n }}>
              <div className="thumb"><Garment type={i.type} color={i.color} /></div>
              <div className="cart-mid">
                <b>{i.name}</b><span className="muted">{i.color[0].toUpperCase() + i.color.slice(1)} / {i.size}</span>
                <div className="qty">
                  <button aria-label="Decrease" onClick={() => setQty(i, i.qty - 1)}><Icon name="minus" size={14} /></button>
                  <span key={i.qty}>{i.qty}</span>
                  <button aria-label="Increase" onClick={() => setQty(i, i.qty + 1)}><Icon name="plus" size={14} /></button>
                </div>
              </div>
              <div className="cart-end"><button aria-label="Remove" onClick={() => remove(i)}><Icon name="trash" size={18} /></button><b>EGP {i.price * i.qty}</b></div>
            </li>
          ))}
        </ul>
        <div className="summary">
          <div className="label">Apply Discount Code</div>
          <div className="coupon"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" /><button className="btn btn-dark btn-sm" onClick={apply}>Apply</button></div>
          {msg && <p className="muted small">{msg}</p>}
          <dl>
            <div><dt>Subtotal</dt><dd>EGP {subtotal}</dd></div>
            {discount && <div><dt>Discount ({discount.code})</dt><dd>- EGP {discount.amount}</dd></div>}
            <div><dt>Shipping</dt><dd>{shipping ? `EGP ${shipping}` : 'Free'}</dd></div>
            <div className="total"><dt>Total</dt><dd>EGP {total}</dd></div>
          </dl>
          <button className="btn btn-dark block" onClick={() => nav('/checkout')}>Proceed to Checkout</button>
        </div>
      </div>
    </>
  )
}
