import { useEffect, useState } from 'react'
import { api, errMsg } from '../api'
import { egp, Empty, ErrorBox, Field, Modal, PageHead, Pill } from '../ui'

const CATEGORIES = ['hoodies', 'tshirts', 'accessories']
const TYPES = ['hoodie', 'tee', 'cap']
const NEW_VARIANT = { sku: '', color: '', size: '', price: '', stock: '0', image: '' }

function Form({ initial, onClose, onSaved }) {
  const [f, setF] = useState(() => initial ? {
    name: initial.name, category: initial.category, type: initial.type, description: initial.description || '',
    price: String(initial.price), oldPrice: initial.oldPrice ?? '', active: initial.active,
    images: (initial.images || []).join('\n'),
    // The API fills every variant price with the product price. Show it empty when it just follows the product price.
    variants: initial.variants.map((v) => ({ sku: v.sku, color: v.color, size: v.size, price: v.price === initial.price ? '' : String(v.price), stock: String(v.stock), image: v.image || '' })),
  } : { name: '', category: 'hoodies', type: 'hoodie', description: '', price: '', oldPrice: '', active: true, images: '', variants: [{ ...NEW_VARIANT }] })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setV = (i, k, v) => setF({ ...f, variants: f.variants.map((x, n) => (n === i ? { ...x, [k]: v } : x)) })

  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const body = {
        name: f.name, category: f.category, type: f.type, description: f.description, price: f.price, oldPrice: f.oldPrice, active: f.active,
        images: f.images.split('\n').map((s) => s.trim()).filter(Boolean),
        variants: f.variants.map((v) => ({ sku: v.sku, color: v.color, size: v.size, price: v.price, stock: v.stock, image: v.image })),
      }
      onSaved(await api.saveProduct(initial?._id, body), !initial)
    } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'New product'} onClose={onClose} wide
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button form="product-form" className="btn dark" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></>}>
      <form id="product-form" onSubmit={save} style={{ display: 'grid', gap: 14 }}>
        <div className="grid2">
          <Field label="Name" wide><input required value={f.name} onChange={set('name')} maxLength={120} /></Field>
          <Field label="Category"><select value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Type (drawing)"><select value={f.type} onChange={set('type')}>{TYPES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Price (EGP)"><input required type="number" min="0" value={f.price} onChange={set('price')} /></Field>
          <Field label="Old price (EGP)" hint="Optional, shown crossed out"><input type="number" min="0" value={f.oldPrice} onChange={set('oldPrice')} /></Field>
        </div>
        <Field label="Description"><textarea value={f.description} onChange={set('description')} maxLength={2000} /></Field>
        <Field label="Image links" hint="One link per line. The first one is the main image."><textarea value={f.images} onChange={set('images')} placeholder="https://..." /></Field>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} />Visible in the store</label>

        <section>
          <h3 style={{ fontSize: '.9rem', marginBottom: 4 }}>Variants (color + size)</h3>
          <p className="muted" style={{ fontSize: '.78rem', marginBottom: 10 }}>Each one needs a unique SKU. Leave the price empty to use the product price.</p>
          <div className="variants">
            <div className="vrow vhead"><span>SKU</span><span>Color</span><span>Size</span><span>Price</span><span>Stock</span><span>Image link</span><span /></div>
            {f.variants.map((v, i) => (
              <div className="vrow" key={i}>
                <input required placeholder="HOOD-BLK-M" value={v.sku} onChange={(e) => setV(i, 'sku', e.target.value)} aria-label="SKU" />
                <input required placeholder="black" value={v.color} onChange={(e) => setV(i, 'color', e.target.value)} aria-label="Color" />
                <input required placeholder="M" value={v.size} onChange={(e) => setV(i, 'size', e.target.value)} aria-label="Size" />
                <input type="number" min="0" placeholder="same" value={v.price} onChange={(e) => setV(i, 'price', e.target.value)} aria-label="Variant price" />
                <input required type="number" min="0" step="1" value={v.stock} onChange={(e) => setV(i, 'stock', e.target.value)} aria-label="Stock" />
                <input placeholder="optional" value={v.image} onChange={(e) => setV(i, 'image', e.target.value)} aria-label="Image link" />
                <button type="button" className="icon-btn" aria-label="Remove variant" disabled={f.variants.length === 1} onClick={() => setF({ ...f, variants: f.variants.filter((_, n) => n !== i) })}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => setF({ ...f, variants: [...f.variants, { ...NEW_VARIANT }] })}>+ Add variant</button>
        </section>
        <ErrorBox>{err}</ErrorBox>
      </form>
    </Modal>
  )
}

export default function Products() {
  const [list, setList] = useState(null)
  const [edit, setEdit] = useState(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { api.products().then(setList).catch((e) => { setErr(errMsg(e)); setList([]) }) }, [])

  const saved = (p, created) => { setList((l) => (created ? [p, ...l] : l.map((x) => (x._id === p._id ? p : x)))); setEdit(null) }
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Old orders keep their own copy of the name and price.`)) return
    setErr('')
    try { await api.deleteProduct(p._id); setList((l) => l.filter((x) => x._id !== p._id)) } catch (x) { setErr(errMsg(x)) }
  }
  const toggle = async (p) => {
    setErr('')
    try { saved(await api.saveProduct(p._id, { active: !p.active }), false) } catch (x) { setErr(errMsg(x)) }
  }

  const shown = (list || []).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.variants.some((v) => v.sku.toLowerCase().includes(q.toLowerCase())))

  return (
    <>
      <PageHead title="Products" sub="What you sell, with its sizes, colors and stock."><button className="btn dark" onClick={() => setEdit('new')}>+ New product</button></PageHead>
      <div style={{ marginBottom: 14, maxWidth: 360 }}><input className="inline-input" placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" /></div>
      <ErrorBox>{err}</ErrorBox>
      {!list ? <Empty>Loading…</Empty> : shown.length === 0 ? <Empty>{list.length ? 'No match.' : 'No products yet.'}</Empty> : (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th /></tr></thead>
          <tbody>{shown.map((p) => {
            const stock = p.variants.reduce((s, v) => s + v.stock, 0)
            const img = p.images?.[0] || p.variants.find((v) => v.image)?.image
            return (
              <tr key={p._id}>
                <td><div className="cell-prod">
                  {img ? <img className="thumb" src={img} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} /> : <span className="thumb" />}
                  <span><b>{p.name}</b><span className="sub">{p.variants.length} variant{p.variants.length === 1 ? '' : 's'}</span></span>
                </div></td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td className="num">{egp(p.price)}{p.oldPrice ? <span className="sub" style={{ textDecoration: 'line-through' }}>{egp(p.oldPrice)}</span> : null}</td>
                <td className="num"><b style={{ color: stock === 0 ? 'var(--red)' : undefined }}>{stock}</b></td>
                <td>{p.active ? <Pill tone="on">Visible</Pill> : <Pill tone="off">Hidden</Pill>}</td>
                <td><div className="row-actions">
                  <button className="btn ghost sm" onClick={() => toggle(p)}>{p.active ? 'Hide' : 'Show'}</button>
                  <button className="btn ghost sm" onClick={() => setEdit(p)}>Edit</button>
                  <button className="btn danger sm" onClick={() => remove(p)}>Delete</button>
                </div></td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
      {edit && <Form initial={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={saved} />}
    </>
  )
}
