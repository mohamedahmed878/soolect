import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageBar } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { api, errMsg } from '../services/api'
import { fmtDate, STATUS } from './Orders'

const egp = (n) => `EGP ${Math.round(n || 0).toLocaleString('en-US')}`
const linkFor = (code) => `${window.location.origin}/?ref=${code}`
const EMPTY = { name: '', code: '', commissionRate: '10', email: '', phone: '' }

function Stat({ label, value, tone }) {
  return <div className={`aff-stat ${tone || ''}`}><small>{label}</small><b>{value}</b></div>
}

function Card({ a, onChange, onRemove, onReload, onError }) {
  const [edit, setEdit] = useState(null) // null = not editing
  const [orders, setOrders] = useState(null) // null = hidden
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const s = a.stats

  const run = async (fn) => {
    setBusy(true); onError('')
    try { await fn() } catch (x) { onError(errMsg(x)) } finally { setBusy(false) }
  }

  const copy = () => {
    navigator.clipboard?.writeText(linkFor(a.code)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }
  const save = (e) => { e.preventDefault(); run(async () => { onChange(await api.adminUpdateAffiliate(a._id, edit)); setEdit(null) }) }
  const toggle = () => run(async () => onChange(await api.adminUpdateAffiliate(a._id, { active: !a.active })))
  const payout = () => {
    if (!window.confirm(`Mark ${egp(s.payable)} as paid to ${a.name}? Do this after you have sent them the money.`)) return
    run(async () => { await api.adminAffiliatePayout(a._id); await onReload(); if (orders) setOrders(await api.adminAffiliateOrders(a._id)) })
  }
  const remove = () => {
    if (!window.confirm(`Delete ${a.name}?`)) return
    run(async () => { await api.adminDeleteAffiliate(a._id); onRemove(a._id) })
  }
  const showOrders = () => (orders ? setOrders(null) : run(async () => setOrders(await api.adminAffiliateOrders(a._id))))
  const f = (k) => (e) => setEdit({ ...edit, [k]: e.target.value })

  return (
    <li className={`aff ${a.active ? '' : 'off'}`}>
      <div className="aff-head">
        <div><b>{a.name}</b><span className="muted">{a.code} · {a.commissionRate}% commission</span></div>
        <span className={`pill ${a.active ? 'delivered' : 'cancelled'}`}>{a.active ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="aff-link"><input readOnly value={linkFor(a.code)} onFocus={(e) => e.target.select()} aria-label="Referral link" /><button className="btn btn-ghost btn-sm" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button></div>

      <div className="aff-stats">
        <Stat label="Orders" value={s.orders} />
        <Stat label="Sales" value={egp(s.sales)} />
        <Stat label="Pending" value={egp(s.pending)} />
        <Stat label="Ready to pay" value={egp(s.payable)} tone={s.payable > 0 ? 'hot' : ''} />
        <Stat label="Paid out" value={egp(s.paid)} />
      </div>

      {edit ? (
        <form className="form" onSubmit={save}>
          <div className="row2">
            <label className="fl"><span>Name</span><input required value={edit.name} onChange={f('name')} /></label>
            <label className="fl"><span>Commission %</span><input required type="number" min="0" max="100" step="0.5" value={edit.commissionRate} onChange={f('commissionRate')} /></label>
          </div>
          <div className="row2">
            <label className="fl"><span>Email</span><input type="email" value={edit.email} onChange={f('email')} /></label>
            <label className="fl"><span>Phone</span><input type="tel" value={edit.phone} onChange={f('phone')} /></label>
          </div>
          <p className="muted small">A new rate applies to future orders only. Existing orders keep the rate they were placed with.</p>
          <div className="btn-row"><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-dark" disabled={busy}>Save</button></div>
        </form>
      ) : (
        <div className="aff-actions">
          <button className="btn btn-dark btn-sm" disabled={busy || s.payable <= 0} onClick={payout}>Mark {egp(s.payable)} paid</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ name: a.name, commissionRate: String(a.commissionRate), email: a.email || '', phone: a.phone || '' })}>Edit</button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={showOrders}>{orders ? 'Hide orders' : 'Orders'}</button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={toggle}>{a.active ? 'Deactivate' : 'Activate'}</button>
          <button className="btn btn-ghost btn-sm danger" disabled={busy} onClick={remove}>Delete</button>
        </div>
      )}

      {orders && (
        orders.length === 0 ? <p className="muted small">No orders yet.</p> : (
          <ul className="aff-orders">
            {orders.map((o) => (
              <li key={o._id}>
                <div><b>#{o.number}</b><span className="muted">{fmtDate(o.createdAt)} · {o.commissionRate}%</span></div>
                <span className={`pill ${o.status}`}>{STATUS[o.status] || o.status}</span>
                <div className="aff-amt"><b>{egp(o.commission)}</b><span className="muted">{o.status === 'cancelled' ? 'void' : o.commissionPaid ? 'paid' : o.status === 'delivered' ? 'to pay' : 'pending'}</span></div>
              </li>
            ))}
          </ul>
        )
      )}
    </li>
  )
}

export default function AdminAffiliates() {
  const { user, loading } = useAuth()
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => api.adminAffiliates().then(setList).catch((x) => { setErr(errMsg(x)); setList([]) }), [])
  useEffect(() => { if (user?.role === 'admin') load() }, [user, load])

  if (loading) return <div className="center muted">Loading…</div>
  if (user?.role !== 'admin') return <Navigate to="/login?next=%2Fadmin%2Faffiliates" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const create = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const a = await api.adminCreateAffiliate({ ...form, code: form.code.trim() })
      setList((l) => [a, ...(l || [])]); setForm(EMPTY); setAdding(false)
    } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }
  const replace = (a) => setList((l) => l.map((x) => (x._id === a._id ? a : x)))
  const drop = (id) => setList((l) => l.filter((x) => x._id !== id))

  const totals = (list || []).reduce((t, a) => ({ sales: t.sales + a.stats.sales, payable: t.payable + a.stats.payable, pending: t.pending + a.stats.pending }), { sales: 0, payable: 0, pending: 0 })

  return (
    <>
      <PageBar title="Marketers" right={<button className="btn btn-dark btn-sm" onClick={() => setAdding((v) => !v)}>{adding ? 'Close' : '+ Add'}</button>} />

      <div className="aff-stats top">
        <Stat label="Marketers" value={list ? list.length : '…'} />
        <Stat label="Sales via links" value={egp(totals.sales)} />
        <Stat label="Pending commission" value={egp(totals.pending)} />
        <Stat label="Ready to pay" value={egp(totals.payable)} tone={totals.payable > 0 ? 'hot' : ''} />
      </div>

      {adding && (
        <form className="form step-in aff-new" onSubmit={create}>
          <h3>New marketer</h3>
          <div className="row2">
            <label className="fl"><span>Name</span><input required value={form.name} onChange={set('name')} /></label>
            <label className="fl"><span>Commission %</span><input required type="number" min="0" max="100" step="0.5" value={form.commissionRate} onChange={set('commissionRate')} /></label>
          </div>
          <label className="fl"><span>Code (optional, e.g. SARA10)</span><input value={form.code} onChange={set('code')} maxLength={20} placeholder="Leave empty to generate one" /></label>
          <div className="row2">
            <label className="fl"><span>Email (optional)</span><input type="email" value={form.email} onChange={set('email')} /></label>
            <label className="fl"><span>Phone (optional)</span><input type="tel" value={form.phone} onChange={set('phone')} /></label>
          </div>
          <p className="muted small">Their link will be {window.location.origin}/?ref=CODE. Use their email so they can&apos;t earn commission on their own orders.</p>
          <button className="btn btn-dark block" disabled={busy}>{busy ? 'Saving…' : 'Create marketer'}</button>
        </form>
      )}

      {err && <p className="error" role="alert">{err}</p>}
      {list === null ? <div className="center muted">Loading…</div> : list.length === 0 ? (
        <p className="center muted">No marketers yet. Add one to get a referral link.</p>
      ) : (
        <ul className="aff-list">{list.map((a) => <Card key={a._id} a={a} onChange={replace} onRemove={drop} onReload={load} onError={setErr} />)}</ul>
      )}
    </>
  )
}
