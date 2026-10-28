import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Garment from '../components/Garment'
import Icon from '../components/Icon'
import { PageBar } from '../components/Layout'
import { useCart, shippingFor } from '../context/CartContext'
import { api, errMsg, isMock } from '../services/api'

const CODES = { SOOLECT10: 0.1 } // demo mode only; with a backend the code is checked by the server

export default function Cart() {
  const { items, setQty, remove, subtotal, discount, setDiscount, count } = useCart()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const shipping = subtotal ? shippingFor('standard', subtotal) : 0
  const total = subtotal - (discount?.amount || 0) + shipping

  const applyCode = async (raw, silent = false) => {
    const c = raw.trim().toUpperCase()
    if (!c) return
    try {
      let result
      if (isMock) {
        if (!CODES[c]) throw new Error('Invalid code')
        result = { code: c, amount: Math.round(subtotal * CODES[c]) }
      } else {
        result = await api.validateCoupon(c, subtotal)
      }
      setDiscount({ code: result.code, amount: result.amount })
      if (!silent) setMsg('Code applied')
    } catch (e) { setDiscount(null); setMsg(errMsg(e)) }
  }
  // The discount depends on the subtotal, so re-check it whenever the cart changes.
  useEffect(() => { if (discount?.code && subtotal) applyCode(discount.code, true) }, [subtotal]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="coupon"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" /><button className="btn btn-dark btn-sm" onClick={() => applyCode(code)}>Apply</button></div>
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
