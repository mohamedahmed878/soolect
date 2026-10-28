import { useState } from 'react'
import Icon from '../components/Icon'
import { PageBar } from '../components/Layout'
import useAddresses from '../hooks/useAddresses'

const EMPTY = { label: 'Home', fullName: '', phone: '', address: '', city: 'Alexandria', isDefault: false }

export default function Addresses() {
  const { list, save, remove, setDefault } = useAddresses()
  const [form, setForm] = useState(null) // null = list view, object = add/edit
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => { e.preventDefault(); save(form); setForm(null) }

  if (form) return (
    <>
      <PageBar title={form._id ? 'Edit Address' : 'New Address'} back={false} right={<button aria-label="Cancel" onClick={() => setForm(null)}><Icon name="close" size={18} /></button>} />
      <form className="form step-in" onSubmit={submit}>
        <label className="fl"><span>Label (Home, Work…)</span><input required value={form.label} onChange={set('label')} /></label>
        <label className="fl"><span>Full Name</span><input required value={form.fullName} onChange={set('fullName')} /></label>
        <label className="fl"><span>Phone</span><input required type="tel" value={form.phone} onChange={set('phone')} /></label>
        <label className="fl"><span>Address</span><input required value={form.address} onChange={set('address')} /></label>
        <label className="fl"><span>City</span><input required value={form.city} onChange={set('city')} /></label>
        <label className="check"><input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /><span>Set as default address</span></label>
        <div className="btn-row"><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-dark">Save Address</button></div>
      </form>
    </>
  )

  return (
    <>
      <PageBar title="Addresses" />
      {!list.length ? (
        <div className="empty"><Icon name="pin" size={42} /><p>No saved addresses yet.</p></div>
      ) : (
        <ul className="addr-list">
          {list.map((a, n) => (
            <li key={a._id} className="addr" style={{ '--i': n }}>
              <div className="addr-head"><b>{a.label}</b>{a.isDefault && <span className="pill processing">Default</span>}</div>
              <span>{a.fullName} · {a.phone}</span>
              <span className="muted">{a.address}, {a.city}</span>
              <div className="addr-actions">
                {!a.isDefault && <button onClick={() => setDefault(a._id)}>Make default</button>}
                <button onClick={() => setForm(a)}>Edit</button>
                <button className="danger" onClick={() => remove(a._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button className="btn btn-dark block addr-add" onClick={() => setForm({ ...EMPTY, isDefault: !list.length })}>Add New Address</button>
    </>
  )
}
