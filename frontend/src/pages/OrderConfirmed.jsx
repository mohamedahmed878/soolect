import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { WhatsAppIcon, waLink } from '../components/WhatsApp'
import { api } from '../services/api'

export default function OrderConfirmed() {
  const { id } = useParams()
  const { state } = useLocation()
  const [params] = useSearchParams()
  const token = state?.token || params.get('token')
  const [number, setNumber] = useState(state?.number || '')
  const [copied, setCopied] = useState(false)

  // Opened again later (refresh, shared link)? Look the code up so it is always the order's own.
  useEffect(() => {
    if (number) return
    api.getOrder(id, token).then((o) => o?.number && setNumber(o.number)).catch(() => {})
  }, [id, token, number])

  const copy = async () => {
    try { await navigator.clipboard.writeText(number); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked */ }
  }

  return (
    <div className="confirm">
      <span className="tick"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg></span>
      <h2>Order Confirmed!</h2>
      <p className="muted">Your order has been placed successfully.</p>

      {number && (
        <div className="code-box">
          <small>Your order code</small>
          <b>{number}</b>
          <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy code'}</button>
        </div>
      )}
      <p className="muted small">Save this code. You can track your order with it and the phone number you used at checkout. Every order gets its own new code.</p>

      <Link className="btn btn-dark block" to={`/orders/${id}${token ? `?token=${token}` : ''}`}>View Order Details</Link>
      <a className="btn btn-wa block" href={waLink(number ? `Hi SOOLECT, my order code is ${number}` : 'Hi SOOLECT')} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={20} /> Contact us on WhatsApp</a>
      <Link className="btn btn-ghost block" to="/shop">Continue Shopping</Link>
    </div>
  )
}
