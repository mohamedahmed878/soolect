import { useCallback, useEffect, useState } from 'react'
import { api, errMsg } from '../api'
import { egp, Empty, ErrorBox, fmtDate, fmtDateTime, Modal, PageHead, PAY_METHOD, PAYMENT, PayPill, StatusPill, STATUS } from '../ui'

const TABS = [['', 'All'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']]
const NEXT = { processing: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [] }
const NEXT_LABEL = { shipped: 'Mark as shipped', delivered: 'Mark as delivered', cancelled: 'Cancel order' }
const PAGE = 20

function Detail({ order, onClose, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const run = async (fn) => {
    setBusy(true); setErr('')
    try { onUpdate({ ...order, ...(await fn()) }) } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }
  const move = (status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel order #${order.number}? Stock and coupon use are restored. This cannot be undone.`)) return
    run(() => api.setOrderStatus(order._id, status))
  }
  const a = order.address || {}

  return (
    <Modal title={`Order #${order.number}`} onClose={onClose} wide>
      <div className="actions"><StatusPill status={order.status} /><PayPill status={order.paymentStatus} /><span className="muted">{fmtDateTime(order.createdAt)}</span></div>

      <div className="grid2">
        <section>
          <h3 style={{ marginBottom: 8, fontSize: '.85rem' }}>Customer</h3>
          <dl className="kv">
            <dt>Name</dt><dd>{a.fullName}</dd>
            <dt>Phone</dt><dd>{order.contact?.phone}</dd>
            {order.contact?.email && <><dt>Email</dt><dd>{order.contact.email}</dd></>}
            <dt>Address</dt><dd>{[a.address, a.city].filter(Boolean).join(', ')}</dd>
            <dt>Account</dt><dd>{order.userId ? 'Registered customer' : 'Guest'}</dd>
          </dl>
        </section>
        <section>
          <h3 style={{ marginBottom: 8, fontSize: '.85rem' }}>Payment &amp; shipping</h3>
          <dl className="kv">
            <dt>Payment</dt><dd>{PAY_METHOD[order.paymentMethod] || order.paymentMethod}</dd>
            <dt>Shipping</dt><dd style={{ textTransform: 'capitalize' }}>{order.shippingMethod}</dd>
            {order.discountCode && <><dt>Coupon</dt><dd>{order.discountCode}</dd></>}
            {order.affiliateCode && <><dt>Marketer</dt><dd>{order.affiliateCode} ({order.commissionRate}%) · {egp(order.commission)}{order.commissionPaid ? ' · paid' : ''}</dd></>}
          </dl>
        </section>
      </div>

      <section>
        <h3 style={{ marginBottom: 6, fontSize: '.85rem' }}>Items</h3>
        <ul className="lines">{order.items.map((i, n) => (
          <li key={n}><span>{i.name}<small>{i.color} / {i.size} · {i.sku} · x{i.qty}</small></span><b>{egp(i.price * i.qty)}</b></li>
        ))}</ul>
        <div className="sum">
          <div><span>Subtotal</span><span>{egp(order.subtotal)}</span></div>
          {order.discount > 0 && <div><span>Discount</span><span>- {egp(order.discount)}</span></div>}
          <div><span>Shipping</span><span>{order.shipping ? egp(order.shipping) : 'Free'}</span></div>
          <div className="total"><span>Total</span><span>{egp(order.total)}</span></div>
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 8, fontSize: '.85rem' }}>Manage</h3>
        <div className="actions">
          {NEXT[order.status].map((s) => <button key={s} className={`btn sm ${s === 'cancelled' ? 'danger' : 'dark'}`} disabled={busy} onClick={() => move(s)}>{NEXT_LABEL[s]}</button>)}
          {NEXT[order.status].length === 0 && <span className="muted">This order is {STATUS[order.status].toLowerCase()}, no more status changes.</span>}
          <span style={{ flex: 1 }} />
          <label className="check" style={{ fontWeight: 600 }}>Payment
            <select className="inline-input" style={{ width: 'auto' }} value={order.paymentStatus} disabled={busy} onChange={(e) => run(() => api.setPaymentStatus(order._id, e.target.value))}>
              {Object.entries(PAYMENT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        <ErrorBox>{err}</ErrorBox>
      </section>

      <section>
        <h3 style={{ marginBottom: 8, fontSize: '.85rem' }}>Timeline</h3>
        <ul className="tl">{(order.timeline || []).map((t, n) => <li key={n}><span style={{ textTransform: 'capitalize' }}>{t.status}</span><span>{fmtDateTime(t.at)}</span></li>)}</ul>
      </section>
    </Modal>
  )
}

export default function Orders() {
  const [status, setStatus] = useState('')
  const [skip, setSkip] = useState(0)
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(() => {
    setErr('')
    api.orders({ status: status || undefined, limit: PAGE, skip }).then(setData).catch((e) => { setErr(errMsg(e)); setData({ orders: [], total: 0 }) })
  }, [status, skip])
  useEffect(() => { load() }, [load])

  const update = (o) => { setOpen(o); setData((d) => ({ ...d, orders: d.orders.map((x) => (x._id === o._id ? o : x)) })) }
  const total = data?.total || 0

  return (
    <>
      <PageHead title="Orders" sub="Click an order to see the details and change its status."><button className="btn ghost sm" onClick={load}>Refresh</button></PageHead>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={`tab ${status === k ? 'on' : ''}`} onClick={() => { setStatus(k); setSkip(0) }}>{l}</button>)}</div>
      <ErrorBox>{err}</ErrorBox>

      {!data ? <Empty>Loading…</Empty> : data.orders.length === 0 ? <Empty>No orders here.</Empty> : (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th className="num">Total</th><th>Payment</th><th>Status</th><th>Marketer</th></tr></thead>
          <tbody>{data.orders.map((o) => (
            <tr key={o._id} className="click" onClick={() => setOpen(o)}>
              <td className="nowrap"><b>#{o.number}</b><span className="sub">{fmtDate(o.createdAt)}</span></td>
              <td>{o.address?.fullName}<span className="sub">{o.contact?.phone}</span></td>
              <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td className="num">{egp(o.total)}</td>
              <td>{PAY_METHOD[o.paymentMethod] || o.paymentMethod}<span className="sub"><PayPill status={o.paymentStatus} /></span></td>
              <td><StatusPill status={o.status} /></td>
              <td>{o.affiliateCode || <span className="muted">-</span>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {total > PAGE && (
        <div className="pager">
          <span>{skip + 1}-{Math.min(skip + PAGE, total)} of {total}</span>
          <span className="actions">
            <button className="btn ghost sm" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE))}>Previous</button>
            <button className="btn ghost sm" disabled={skip + PAGE >= total} onClick={() => setSkip(skip + PAGE)}>Next</button>
          </span>
        </div>
      )}

      {open && <Detail order={open} onClose={() => setOpen(null)} onUpdate={update} />}
    </>
  )
}
