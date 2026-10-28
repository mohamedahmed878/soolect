import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ProductImage from '../components/ProductImage'
import { PageBar } from '../components/Layout'
import { WhatsAppIcon, waLink } from '../components/WhatsApp'
import { api, errMsg } from '../services/api'
import useLiveOrders from '../hooks/useLiveOrders'
import { STATUS, fmtDate } from './Orders'

const FLOW = [['placed', 'Order Placed'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered']]

export default function OrderDetails() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [o, setO] = useState(null)
  const [missing, setMissing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { api.getOrder(id, token).then((d) => (d ? setO(d) : setMissing(true))).catch(() => setMissing(true)) }, [id, token])
  useLiveOrders((u) => u._id === id && setO(u))
  if (missing) return <><PageBar title="Order Details" /><div className="empty"><p>We couldn't find this order.</p><Link to="/orders" className="btn btn-dark">My orders</Link></div></>
  if (!o) return <p className="center muted">Loading…</p>

  const cancel = async () => {
    if (!window.confirm(`Cancel order #${o.number}? This cannot be undone.`)) return
    setErr(''); setBusy(true)
    try { setO(await api.cancelOrder(o._id, token)) } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  const reached = o.status === 'delivered' ? 3 : o.status === 'shipped' ? 2 : 1
  const at = (k) => o.timeline?.find((t) => t.status === k)?.at
  return (
    <>
      <PageBar title="Order Details" />
      <div className="od">
        <div className="ocard-head"><div><b>#{o.number}</b><span className="muted">{fmtDate(o.createdAt)} · EGP {o.total}</span></div><span className={`pill ${o.status}`}>{STATUS[o.status] || o.status}</span></div>
        {o.status === 'cancelled' ? <p className="notice">This order was cancelled.</p> : (
        <ol className="timeline">
          {FLOW.map(([k, l], i) => (
            <li key={k} className={i <= reached ? 'done' : ''}><i /><div><b>{l}</b>{at(k) && <span className="muted">{new Date(at(k)).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>}</div></li>
          ))}
        </ol>)}
        <h3>Items ({o.items.length})</h3>
        <ul className="mini">{o.items.map((i, k) => <li key={k}><div className="thumb sm"><ProductImage src={i.image} type={i.type} color={i.color} alt={i.name} /></div><div><b>{i.name}</b><span className="muted">{i.color} / {i.size} · x{i.qty}</span></div><b>EGP {i.price * i.qty}</b></li>)}</ul>
        {o.address && <p className="muted small">Shipping to {o.address.fullName}, {o.address.address}, {o.address.city}</p>}
        {err && <p className="error" role="alert">{err}</p>}
        {o.status === 'processing' && <button className="btn btn-ghost block danger-btn" disabled={busy} onClick={cancel}>{busy ? 'Cancelling…' : 'Cancel this order'}</button>}
        <a className="btn btn-wa block" href={waLink(`Hi SOOLECT, about my order ${o.number}`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={20} /> Need help? WhatsApp us</a>
      </div>
    </>
  )
}
