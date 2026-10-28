import { useEffect, useState } from 'react'
import { api, errMsg } from '../api'
import { egp, Empty, ErrorBox, Field, fmtDate, Modal, PageHead, Pill } from '../ui'

const BLANK = { code: '', type: 'percent', value: '10', maxDiscount: '', minSubtotal: '0', usageLimit: '', expiresAt: '', active: true }
const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date()

function Form({ initial, onClose, onSaved }) {
  const [f, setF] = useState(initial ? {
    code: initial.code, type: initial.type, value: String(initial.value), maxDiscount: initial.maxDiscount ?? '', minSubtotal: String(initial.minSubtotal ?? 0),
    usageLimit: initial.usageLimit ?? '', expiresAt: dateInput(initial.expiresAt), active: initial.active,
  } : BLANK)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const body = {
        code: f.code, type: f.type, value: f.value, minSubtotal: f.minSubtotal || 0, active: f.active,
        maxDiscount: f.type === 'percent' ? f.maxDiscount : '', usageLimit: f.usageLimit, expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : '', // end of that day in the admin's own time zone
      }
      onSaved(await api.saveCoupon(initial?._id, body), !initial)
    } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  return (
    <Modal title={initial ? `Edit ${initial.code}` : 'New coupon'} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button form="coupon-form" className="btn dark" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
      <form id="coupon-form" onSubmit={save} className="grid2">
        <Field label="Code"><input required value={f.code} onChange={set('code')} maxLength={40} placeholder="WELCOME10" style={{ textTransform: 'uppercase' }} /></Field>
        <Field label="Type"><select value={f.type} onChange={set('type')}><option value="percent">Percent (%)</option><option value="fixed">Fixed amount (EGP)</option></select></Field>
        <Field label={f.type === 'percent' ? 'Discount %' : 'Discount (EGP)'}><input required type="number" min="1" max={f.type === 'percent' ? 100 : undefined} value={f.value} onChange={set('value')} /></Field>
        {f.type === 'percent' ? <Field label="Max discount (EGP)" hint="Optional cap"><input type="number" min="0" value={f.maxDiscount} onChange={set('maxDiscount')} /></Field> : <div />}
        <Field label="Minimum order (EGP)"><input type="number" min="0" value={f.minSubtotal} onChange={set('minSubtotal')} /></Field>
        <Field label="Usage limit" hint="Empty = unlimited"><input type="number" min="1" value={f.usageLimit} onChange={set('usageLimit')} /></Field>
        <Field label="Expires on" hint="Empty = never"><input type="date" value={f.expiresAt} onChange={set('expiresAt')} /></Field>
        <label className="check" style={{ alignSelf: 'end', paddingBottom: 10 }}><input type="checkbox" checked={f.active} onChange={set('active')} />Active</label>
        <div style={{ gridColumn: '1/-1' }}><ErrorBox>{err}</ErrorBox></div>
      </form>
    </Modal>
  )
}

export default function Coupons() {
  const [list, setList] = useState(null)
  const [edit, setEdit] = useState(null) // null | 'new' | coupon
  const [err, setErr] = useState('')

  useEffect(() => { api.coupons().then(setList).catch((e) => { setErr(errMsg(e)); setList([]) }) }, [])

  const saved = (c, created) => { setList((l) => (created ? [c, ...l] : l.map((x) => (x._id === c._id ? c : x)))); setEdit(null) }
  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return
    setErr('')
    try { await api.deleteCoupon(c._id); setList((l) => l.filter((x) => x._id !== c._id)) } catch (x) { setErr(errMsg(x)) }
  }
  const toggle = async (c) => {
    setErr('')
    try { saved(await api.saveCoupon(c._id, { active: !c.active }), false) } catch (x) { setErr(errMsg(x)) }
  }

  return (
    <>
      <PageHead title="Coupons" sub="Discount codes customers type at checkout."><button className="btn dark" onClick={() => setEdit('new')}>+ New coupon</button></PageHead>
      <ErrorBox>{err}</ErrorBox>
      {!list ? <Empty>Loading…</Empty> : list.length === 0 ? <Empty>No coupons yet.</Empty> : (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c._id}>
              <td><b>{c.code}</b></td>
              <td>{c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ${egp(c.maxDiscount)})` : ''}` : egp(c.value)}</td>
              <td>{c.minSubtotal ? egp(c.minSubtotal) : '-'}</td>
              <td>{c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
              <td>{c.expiresAt ? fmtDate(c.expiresAt) : 'Never'}</td>
              <td>{!c.active ? <Pill tone="off">Inactive</Pill> : isExpired(c) ? <Pill tone="off">Expired</Pill> : <Pill tone="on">Active</Pill>}</td>
              <td><div className="row-actions">
                <button className="btn ghost sm" onClick={() => toggle(c)}>{c.active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn ghost sm" onClick={() => setEdit(c)}>Edit</button>
                <button className="btn danger sm" onClick={() => remove(c)}>Delete</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {edit && <Form initial={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={saved} />}
    </>
  )
}
