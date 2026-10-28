import { useCallback, useEffect, useState } from 'react'
import { api, errMsg } from '../api'
import { egp, Empty, ErrorBox, Field, fmtDate, Modal, PageHead, Pill, StatusPill } from '../ui'

const BLANK = { name: '', code: '', commissionRate: '10', email: '', phone: '' }

const Stat = ({ label, value, hot }) => <div className={`aff-stat ${hot ? 'hot' : ''}`}><small>{label}</small><b>{value}</b></div>

function Card({ a, base, onChange, onRemove, onReload, onError }) {
  const [edit, setEdit] = useState(null)
  const [orders, setOrders] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const s = a.stats
  const link = `${base}/?ref=${a.code}`

  const run = async (fn) => {
    setBusy(true); onError('')
    try { await fn() } catch (x) { onError(errMsg(x)) } finally { setBusy(false) }
  }
  const copy = () => navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  const save = (e) => { e.preventDefault(); run(async () => { onChange(await api.updateAffiliate(a._id, edit)); setEdit(null) }) }
  const toggle = () => run(async () => onChange(await api.updateAffiliate(a._id, { active: !a.active })))
  const payout = () => {
    if (!window.confirm(`Mark ${egp(s.payable)} as paid to ${a.name}? Do this after you have sent them the money.`)) return
    run(async () => { await api.affiliatePayout(a._id); await onReload(); if (orders) setOrders(await api.affiliateOrders(a._id)) })
  }
  const remove = () => {
    if (!window.confirm(`Delete ${a.name}?`)) return
    run(async () => { await api.deleteAffiliate(a._id); onRemove(a._id) })
  }
  const toggleOrders = () => (orders ? setOrders(null) : run(async () => setOrders(await api.affiliateOrders(a._id))))
  const f = (k) => (e) => setEdit({ ...edit, [k]: e.target.value })

  return (
    <li className={`aff ${a.active ? '' : 'off'}`}>
      <div className="aff-head">
        <div><b>{a.name}</b><span className="muted">{a.code} · {a.commissionRate}% commission{a.phone ? ` · ${a.phone}` : ''}</span></div>
        {a.active ? <Pill tone="on">Active</Pill> : <Pill tone="off">Inactive</Pill>}
      </div>

      <div className="aff-link"><input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Referral link" /><button className="btn ghost sm" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button></div>

      <div className="aff-stats">
        <Stat label="Orders" value={s.orders} />
        <Stat label="Sales" value={egp(s.sales)} />
        <Stat label="Pending" value={egp(s.pending)} />
        <Stat label="Ready to pay" value={egp(s.payable)} hot={s.payable > 0} />
        <Stat label="Paid out" value={egp(s.paid)} />
      </div>

      {edit ? (
        <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          <div className="grid2">
            <Field label="Name"><input required value={edit.name} onChange={f('name')} /></Field>
            <Field label="Commission %"><input required type="number" min="0" max="100" step="0.5" value={edit.commissionRate} onChange={f('commissionRate')} /></Field>
            <Field label="Email"><input type="email" value={edit.email} onChange={f('email')} /></Field>
            <Field label="Phone"><input type="tel" value={edit.phone} onChange={f('phone')} /></Field>
          </div>
          <p className="muted" style={{ fontSize: '.78rem' }}>A new rate applies to future orders only. Existing orders keep the rate they were placed with.</p>
          <div className="actions"><button type="button" className="btn ghost sm" onClick={() => setEdit(null)}>Cancel</button><button className="btn dark sm" disabled={busy}>Save</button></div>
        </form>
      ) : (
        <div className="actions">
          <button className="btn dark sm" disabled={busy || s.payable <= 0} onClick={payout}>Mark {egp(s.payable)} paid</button>
          <button className="btn ghost sm" onClick={() => setEdit({ name: a.name, commissionRate: String(a.commissionRate), email: a.email || '', phone: a.phone || '' })}>Edit</button>
          <button className="btn ghost sm" disabled={busy} onClick={toggleOrders}>{orders ? 'Hide orders' : 'Orders'}</button>
          <button className="btn ghost sm" disabled={busy} onClick={toggle}>{a.active ? 'Deactivate' : 'Activate'}</button>
          <button className="btn danger sm" disabled={busy} onClick={remove}>Delete</button>
        </div>
      )}

      {orders && (orders.length === 0 ? <p className="muted">No orders yet.</p> : (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Order</th><th>Status</th><th className="num">Order total</th><th className="num">Commission</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o._id}>
              <td><b>#{o.number}</b><span className="sub">{fmtDate(o.createdAt)} · {o.commissionRate}%</span></td>
              <td><StatusPill status={o.status} /></td>
              <td className="num">{egp(o.total)}</td>
              <td className="num"><b>{egp(o.commission)}</b><span className="sub">{o.status === 'cancelled' ? 'void' : o.commissionPaid ? 'paid' : o.status === 'delivered' ? 'to pay' : 'pending'}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
    </li>
  )
}

export default function Marketers() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [base, setBase] = useState(() => localStorage.getItem('soolect_store_url') || import.meta.env.VITE_STORE_URL || '')

  const load = useCallback(() => api.affiliates().then(setList).catch((x) => { setErr(errMsg(x)); setList([]) }), [])
  useEffect(() => { load() }, [load])

  const baseClean = base.trim().replace(/\/$/, '')
  const saveBase = (v) => { setBase(v); try { localStorage.setItem('soolect_store_url', v) } catch { /* ignore */ } }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const create = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { const a = await api.createAffiliate({ ...form, code: form.code.trim() }); setList((l) => [a, ...l]); setForm(BLANK); setAdding(false) }
    catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }
  const replace = (a) => setList((l) => l.map((x) => (x._id === a._id ? a : x)))
  const drop = (id) => setList((l) => l.filter((x) => x._id !== id))
  const totals = (list || []).reduce((t, a) => ({ sales: t.sales + a.stats.sales, pending: t.pending + a.stats.pending, payable: t.payable + a.stats.payable, paid: t.paid + a.stats.paid }), { sales: 0, pending: 0, payable: 0, paid: 0 })

  return (
    <>
      <PageHead title="Marketers" sub="Referral links and commissions. A commission is due once the order is delivered.">
        <button className="btn dark" onClick={() => setAdding(true)}>+ New marketer</button>
      </PageHead>

      <div className="tiles">
        <div className="tile"><small>Marketers</small><b>{list ? list.length : '…'}</b></div>
        <div className="tile"><small>Sales through links</small><b>{egp(totals.sales)}</b></div>
        <div className="tile"><small>Pending commission</small><b>{egp(totals.pending)}</b></div>
        <div className={`tile ${totals.payable > 0 ? 'hot' : ''}`}><small>Ready to pay</small><b>{egp(totals.payable)}</b></div>
        <div className="tile"><small>Paid out</small><b>{egp(totals.paid)}</b></div>
      </div>

      <div className="card" style={{ marginBottom: 16, maxWidth: 560 }}>
        <Field label="Store address" hint="Used to build the referral links, e.g. https://soolect.vercel.app. Saved in this browser."><input value={base} onChange={(e) => saveBase(e.target.value)} placeholder="https://your-store.vercel.app" /></Field>
      </div>

      <ErrorBox>{err}</ErrorBox>
      {list === null ? <Empty>Loading…</Empty> : list.length === 0 ? <Empty>No marketers yet. Add one to get a referral link.</Empty> : (
        <ul className="aff-list">{list.map((a) => <Card key={a._id} a={a} base={baseClean || '(store address)'} onChange={replace} onRemove={drop} onReload={load} onError={setErr} />)}</ul>
      )}

      {adding && (
        <Modal title="New marketer" onClose={() => setAdding(false)}
          footer={<><button className="btn ghost" onClick={() => setAdding(false)}>Cancel</button><button form="aff-form" className="btn dark" disabled={busy}>{busy ? 'Saving…' : 'Create marketer'}</button></>}>
          <form id="aff-form" onSubmit={create} className="grid2">
            <Field label="Name"><input required value={form.name} onChange={set('name')} maxLength={80} /></Field>
            <Field label="Commission %"><input required type="number" min="0" max="100" step="0.5" value={form.commissionRate} onChange={set('commissionRate')} /></Field>
            <Field label="Code (optional)" hint="Letters and numbers, e.g. SARA10. Empty = generated."><input value={form.code} onChange={set('code')} maxLength={20} style={{ textTransform: 'uppercase' }} /></Field>
            <Field label="Email (optional)" hint="Blocks commission on their own orders."><input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Phone (optional)"><input type="tel" value={form.phone} onChange={set('phone')} /></Field>
          </form>
        </Modal>
      )}
    </>
  )
}
