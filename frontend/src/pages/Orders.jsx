import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from '../components/ProductImage'
import { PageBar } from '../components/Layout'
import { api, errMsg } from '../services/api'
import { useAuth } from '../context/AuthContext'
import useLiveOrders from '../hooks/useLiveOrders'

export const STATUS = { processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
const TABS = [['all', 'All'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered']]
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function TrackForm() {
  const nav = useNavigate()
  const [f, setF] = useState({ number: '', phone: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { const o = await api.trackOrder(f); nav(`/orders/${o._id}${o.accessToken ? `?token=${o.accessToken}` : ''}`) }
    catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h3>Track an order</h3>
      <label className="fl"><span>Order number</span><input required value={f.number} onChange={set('number')} placeholder="SO10001" /></label>
      <label className="fl"><span>Phone used at checkout</span><input required type="tel" value={f.phone} onChange={set('phone')} /></label>
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn btn-dark block" disabled={busy}>{busy ? 'Searching…' : 'Track order'}</button>
    </form>
  )
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (authLoading) return
    setLoading(true)
    api.getMyOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false))
  }, [user, authLoading])
  useLiveOrders((o) => setOrders((prev) => (prev.some((x) => x._id === o._id) ? prev.map((x) => (x._id === o._id ? o : x)) : [o, ...prev])))
  const list = tab === 'all' ? orders : orders.filter((o) => o.status === tab)

  return (
    <>
      <PageBar title="My Orders" back={false} />
      <div className="utabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {loading ? <p className="center muted">Loading…</p> : !list.length ? <p className="center muted">No orders here yet.</p> : (
        <ul className="orders">
          {list.map((o, n) => (
            <li key={o._id} className="ocard" style={{ '--i': n }}>
              <div className="ocard-head"><div><b>#{o.number}</b><span className="muted">{fmtDate(o.createdAt)} · EGP {o.total}</span></div><span className={`pill ${o.status}`}>{STATUS[o.status] || o.status}</span></div>
              <div className="ocard-thumbs">{o.items.slice(0, 3).map((i, k) => <div key={k} className="thumb sm"><ProductImage src={i.image} type={i.type} color={i.color} alt={i.name} /></div>)}{o.items.length > 3 && <span className="more">+{o.items.length - 3}</span>}</div>
              <Link to={`/orders/${o._id}`} className="btn btn-ghost block">View Details</Link>
            </li>
          ))}
        </ul>
      )}
      {!user && <TrackForm />}
    </>
  )
}
