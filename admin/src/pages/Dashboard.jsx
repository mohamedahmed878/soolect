import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errMsg } from '../api'
import { egp, Empty, ErrorBox, fmtDate, PageHead, StatusPill } from '../ui'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [owed, setOwed] = useState(0)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setErr(errMsg(e)))
    api.orders({ limit: 6 }).then((r) => setRecent(r.orders)).catch(() => {})
    api.affiliates().then((l) => setOwed(l.reduce((s, a) => s + a.stats.payable, 0))).catch(() => {})
  }, [])

  const o = stats?.orders || {}
  const live = (o.processing || 0) + (o.shipped || 0)

  return (
    <>
      <PageHead title="Dashboard" sub="How the store is doing right now." />
      <ErrorBox>{err}</ErrorBox>

      <div className="tiles">
        <div className="tile"><small>Sales (cancelled excluded)</small><b>{stats ? egp(stats.revenue) : '…'}</b></div>
        <div className="tile"><small>Orders</small><b>{stats ? stats.paidOrDueOrders : '…'}</b></div>
        <div className="tile"><small>To process or deliver</small><b>{stats ? live : '…'}</b></div>
        <div className="tile"><small>Delivered</small><b>{stats ? o.delivered || 0 : '…'}</b></div>
        <div className={`tile ${owed > 0 ? 'hot' : ''}`}><small>Commission ready to pay</small><b>{egp(owed)}</b></div>
      </div>

      <div className="cols">
        <section className="card">
          <h3>Latest orders</h3>
          {recent.length === 0 ? <Empty>No orders yet.</Empty> : (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Order</th><th>Customer</th><th className="num">Total</th><th>Status</th></tr></thead>
              <tbody>{recent.map((r) => (
                <tr key={r._id}>
                  <td><b>#{r.number}</b><span className="sub">{fmtDate(r.createdAt)}</span></td>
                  <td>{r.address?.fullName}<span className="sub">{r.contact?.phone}</span></td>
                  <td className="num">{egp(r.total)}</td>
                  <td><StatusPill status={r.status} /></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
          <p style={{ marginTop: 12 }}><Link className="btn ghost sm" to="/orders">All orders</Link></p>
        </section>

        <section className="card">
          <h3>Low stock (3 or fewer)</h3>
          {!stats ? <Empty>Loading…</Empty> : stats.lowStock.length === 0 ? <Empty>Everything is well stocked.</Empty> : (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Product</th><th className="num">Left</th></tr></thead>
              <tbody>{stats.lowStock.map((v) => (
                <tr key={`${v.productId}${v.sku}`}>
                  <td>{v.name}<span className="sub">{v.color} / {v.size} · {v.sku}</span></td>
                  <td className="num"><b style={{ color: v.stock === 0 ? 'var(--red)' : 'var(--amber)' }}>{v.stock}</b></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
          <p style={{ marginTop: 12 }}><Link className="btn ghost sm" to="/products">Manage products</Link></p>
        </section>
      </div>
    </>
  )
}
