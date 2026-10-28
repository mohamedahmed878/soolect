import { useEffect } from 'react'

export const egp = (n) => `EGP ${Math.round(Number(n) || 0).toLocaleString('en-US')}`
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

export const STATUS = { processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
export const PAYMENT = { pending: 'Unpaid', paid: 'Paid', failed: 'Failed', refunded: 'Refunded' }
export const PAY_METHOD = { card: 'Card', vodafone: 'Vodafone Cash', cod: 'Cash on delivery', paypal: 'PayPal' }

export const Pill = ({ tone, children }) => <span className={`pill ${tone || ''}`}>{children}</span>
export const StatusPill = ({ status }) => <Pill tone={status}>{STATUS[status] || status}</Pill>
export const PayPill = ({ status }) => <Pill tone={`pay-${status}`}>{PAYMENT[status] || status}</Pill>

export function Field({ label, hint, children, wide }) {
  return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function Modal({ title, onClose, children, wide, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button></header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="page-actions">{children}</div></div>
)

export const Empty = ({ children }) => <p className="empty">{children}</p>
export const ErrorBox = ({ children }) => (children ? <p className="error" role="alert">{children}</p> : null)
