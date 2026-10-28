import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Garment from '../components/Garment'
import { PageBar } from '../components/Layout'
import { api } from '../services/api'
import useLiveOrders from '../hooks/useLiveOrders'

export const STATUS = { processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
const TABS = [['all', 'All'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered']]
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.getMyOrders().then(setOrders).finally(() => setLoading(false)) }, [])
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
              <div className="ocard-thumbs">{o.items.slice(0, 3).map((i, k) => <div key={k} className="thumb sm"><Garment type={i.type} color={i.color} /></div>)}{o.items.length > 3 && <span className="more">+{o.items.length - 3}</span>}</div>
              <Link to={`/orders/${o._id}`} className="btn btn-ghost block">View Details</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
