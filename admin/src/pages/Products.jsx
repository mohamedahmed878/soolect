import { useEffect, useRef, useState } from 'react'
import { api, errMsg } from '../api'
import { compressImage, imgSrc } from '../imageTools'
import { egp, Empty, ErrorBox, Field, Modal, PageHead, Pill } from '../ui'

const CATEGORIES = ['hoodies', 'tshirts', 'accessories']
const TYPES = ['hoodie', 'tee', 'cap']
const NEW_VARIANT = { sku: '', color: '', size: '', price: '', stock: '0', image: '' }

// Compress in the browser, then upload. Returns the stored URLs, in order.
async function uploadFiles(files, onError) {
  const urls = []
  for (const file of files) {
    try {
      const blob = await compressImage(file)
      urls.push((await api.uploadImage(blob)).url)
    } catch (x) { onError(`${file.name}: ${errMsg(x)}`) }
  }
  return urls
}

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_PHOTOS = 10

function Photos({ value, onChange }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [link, setLink] = useState('')

  const pick = async (e) => {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - value.length)
    e.target.value = '' // allows choosing the same file again
    if (!files.length) return
    setErr(''); setBusy(true)
    const urls = await uploadFiles(files, setErr)
    setBusy(false)
    if (urls.length) onChange([...value, ...urls])
  }
  const addLink = () => {
    const u = link.trim()
    if (!/^https?:\/\//i.test(u)) { setErr('A link must start with https://'); return }
    setErr(''); setLink(''); onChange([...value, u].slice(0, MAX_PHOTOS))
  }

  return (
    <div className="photos">
      {value.length > 0 && (
        <ul className="photo-grid">
          {value.map((u, i) => (
            <li key={u + i}>
              <img src={imgSrc(u)} alt={`Photo ${i + 1}`} onError={(e) => { e.currentTarget.style.opacity = '.25' }} />
              {i === 0 ? <span className="photo-main">Main</span> : <button type="button" className="photo-star" aria-label="Make main photo" title="Make main" onClick={() => onChange([u, ...value.filter((_, n) => n !== i)])}>★</button>}
              <button type="button" className="photo-x" aria-label="Remove photo" onClick={() => onChange(value.filter((_, n) => n !== i))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <div className="photo-actions">
        <button type="button" className="btn dark sm" disabled={busy || value.length >= MAX_PHOTOS} onClick={() => input.current?.click()}>{busy ? 'Uploading…' : '📷 Add photos'}</button>
        <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={pick} />
        <span className="muted" style={{ fontSize: '.74rem' }}>{value.length}/{MAX_PHOTOS}</span>
      </div>
      <div className="photo-link">
        <input placeholder="or paste an image link (https://…)" value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }} />
        <button type="button" className="btn ghost sm" disabled={!link.trim()} onClick={addLink}>Add</button>
      </div>
      {err && <p className="error-text">{err}</p>}
    </div>
  )
}

// One photo for a single color/size, shown next to its row.
function VariantPhoto({ value, onChange }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const pick = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    const [url] = await uploadFiles([file], (m) => window.alert(m))
    setBusy(false)
    if (url) onChange(url)
  }
  return (
    <div className="vphoto">
      {value
        ? <><img src={imgSrc(value)} alt="" /><button type="button" className="icon-btn" aria-label="Remove photo" onClick={() => onChange('')}>✕</button></>
        : <button type="button" className="btn ghost sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? '…' : '📷 Add'}</button>}
      <input ref={input} type="file" accept={ACCEPT} hidden onChange={pick} />
    </div>
  )
}

function Form({ initial, onClose, onSaved }) {
  const [f, setF] = useState(() => initial ? {
    name: initial.name, category: initial.category, type: initial.type, description: initial.description || '',
    price: String(initial.price), oldPrice: initial.oldPrice ?? '', active: initial.active,
    images: initial.images || [],
    // The API fills every variant price with the product price. Show it empty when it just follows the product price.
    variants: initial.variants.map((v) => ({ sku: v.sku, color: v.color, size: v.size, price: v.price === initial.price ? '' : String(v.price), stock: String(v.stock), image: v.image || '' })),
  } : { name: '', category: 'hoodies', type: 'hoodie', description: '', price: '', oldPrice: '', active: true, images: [], variants: [{ ...NEW_VARIANT }] })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setV = (i, k, v) => setF({ ...f, variants: f.variants.map((x, n) => (n === i ? { ...x, [k]: v } : x)) })

  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const body = {
        name: f.name, category: f.category, type: f.type, description: f.description, price: f.price, oldPrice: f.oldPrice, active: f.active,
        images: f.images,
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
        <div className="field"><span>Photos</span><Photos value={f.images} onChange={(images) => setF((x) => ({ ...x, images }))} /><small>PNG or JPG, straight from your phone or computer. The first photo is the main one.</small></div>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} />Visible in the store</label>

        <section>
          <h3 style={{ fontSize: '.9rem', marginBottom: 4 }}>Variants (color + size)</h3>
          <p className="muted" style={{ fontSize: '.78rem', marginBottom: 10 }}>Each one needs a unique SKU. Leave the price empty to use the product price.</p>
          <div className="variants">
            <div className="vrow vhead"><span>SKU</span><span>Color</span><span>Size</span><span>Price</span><span>Stock</span><span>Photo</span><span /></div>
            {f.variants.map((v, i) => (
              <div className="vrow" key={i}>
                <input required placeholder="HOOD-BLK-M" value={v.sku} onChange={(e) => setV(i, 'sku', e.target.value)} aria-label="SKU" />
                <input required placeholder="black" value={v.color} onChange={(e) => setV(i, 'color', e.target.value)} aria-label="Color" />
                <input required placeholder="M" value={v.size} onChange={(e) => setV(i, 'size', e.target.value)} aria-label="Size" />
                <input type="number" min="0" placeholder="same" value={v.price} onChange={(e) => setV(i, 'price', e.target.value)} aria-label="Variant price" />
                <input required type="number" min="0" step="1" value={v.stock} onChange={(e) => setV(i, 'stock', e.target.value)} aria-label="Stock" />
                <VariantPhoto value={v.image} onChange={(u) => setV(i, 'image', u)} />
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
                  {img ? <img className="thumb" src={imgSrc(img)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} /> : <span className="thumb" />}
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
