import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Garment from '../components/Garment'
import { PageBar } from '../components/Layout'
import { api } from '../services/api'
import useLiveOrders from '../hooks/useLiveOrders'
import { STATUS, fmtDate } from './Orders'

const FLOW = [['placed', 'Order Placed'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered']]

export default function OrderDetails() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [o, setO] = useState(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => { api.getOrder(id, token).then((d) => (d ? setO(d) : setMissing(true))).catch(() => setMissing(true)) }, [id, token])
  useLiveOrders((u) => u._id === id && setO(u))
  if (missing) return <><PageBar title="Order Details" /><div className="empty"><p>We couldn't find this order.</p><Link to="/orders" className="btn btn-dark">My orders</Link></div></>
  if (!o) return <p className="center muted">Loading…</p>

  const reached = o.status === 'delivered' ? 3 : o.status === 'shipped' ? 2 : 1
  const at = (k) => o.timeline?.find((t) => t.status === k)?.at
  return (
    <>
      <PageBar title="Order Details" />
      <div className="od">
        <div className="ocard-head"><div><b>#{o.number}</b><span className="muted">{fmtDate(o.createdAt)} · EGP {o.total}</span></div><span className={`pill ${o.status}`}>{STATUS[o.status] || o.status}</span></div>
        <ol className="timeline">
          {FLOW.map(([k, l], i) => (
            <li key={k} className={i <= reached ? 'done' : ''}><i /><div><b>{l}</b>{at(k) && <span className="muted">{new Date(at(k)).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>}</div></li>
          ))}
        </ol>
        <h3>Items ({o.items.length})</h3>
        <ul className="mini">{o.items.map((i, k) => <li key={k}><div className="thumb sm"><Garment type={i.type} color={i.color} /></div><div><b>{i.name}</b><span className="muted">{i.color} / {i.size} · x{i.qty}</span></div><b>EGP {i.price * i.qty}</b></li>)}</ul>
        {o.address && <p className="muted small">Shipping to {o.address.fullName}, {o.address.address}, {o.address.city}</p>}
      </div>
    </>
  )
}
