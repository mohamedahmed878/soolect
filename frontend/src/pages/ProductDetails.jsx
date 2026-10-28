import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProductImage, { pickImage } from '../components/ProductImage'
import Icon from '../components/Icon'
import Stars from '../components/Stars'
import { api } from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { COLORS } from '../data/mockData'

export default function ProductDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const { add } = useCart()
  const [p, setP] = useState(null)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [photo, setPhoto] = useState('') // a photo the shopper picked from the gallery
  const [added, setAdded] = useState(false)
  const { has, toggle } = useWishlist()
  const fav = has(id)
  const [fly, setFly] = useState(null)
  const btn = useRef(null)

  useEffect(() => { api.getProduct(id).then((d) => { setP(d); setColor(d.colors[0]); setSize(d.sizes.includes('M') ? 'M' : d.sizes[0]) }) }, [id])
  // Keep the chosen size valid when the color changes (some sizes may be out of stock in that color).
  useEffect(() => {
    if (!p?.variants) return
    if (p.variants.some((v) => v.color === color && v.size === size && v.stock > 0)) return
    const first = p.variants.find((v) => v.color === color && v.stock > 0)
    if (first) setSize(first.size)
  }, [p, color, size])
  if (!p) return <div className="pd-hero"><div className="skel" style={{ aspectRatio: 1 }} /></div>

  const chooseColor = (c) => { setColor(c); setPhoto('') }
  const main = photo || pickImage(p, color)
  const variantOf = (c, s) => p.variants?.find((v) => v.color === c && v.size === s)
  const price = variantOf(color, size)?.price ?? p.price
  const soldOut = !!p.variants && !(variantOf(color, size)?.stock > 0)
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const addToCart = () => {
    add({ productId: p._id, name: p.name, type: p.type, price, color, size, image: pickImage(p, color) })
    const r = btn.current.getBoundingClientRect()
    setFly({ x: r.left + r.width / 2, y: r.top, dx: window.innerWidth - r.left - r.width / 2 - 70, dy: -r.top + 28 })
    setAdded(true); setTimeout(() => { setAdded(false); setFly(null) }, 1500)
  }

  return (
    <div className="pd">
      <div className="pd-hero">
        <div className="pagebar">
          <button aria-label="Back" onClick={() => nav(-1)}><Icon name="back" /></button><h1>{p.name}</h1>
          <div className="pagebar-right"><button aria-label="Share" onClick={() => navigator.share?.({ title: p.name, url: location.href })}><Icon name="share" size={18} /></button><button aria-label="Wishlist" className={`heartbtn ${fav ? 'on' : ''}`} style={{ position: 'static', width: 34, height: 34 }} onClick={() => toggle(p._id)}><Icon name="heart" size={18} /></button></div>
        </div>
        <div className="pd-main"><ProductImage key={main || color} src={main} type={p.type} color={color} alt={p.name} /></div>
        {p.images?.length > 1 ? (
          <div className="pd-thumbs">{p.images.map((u) => <button key={u} className={u === main ? 'on' : ''} onClick={() => setPhoto(u)} aria-label="Show photo"><ProductImage src={u} type={p.type} color={color} /></button>)}</div>
        ) : (
          <div className="pd-thumbs">{p.colors.concat(p.colors).slice(0, 4).map((c, n) => <button key={n} className={c === color && n < p.colors.length ? 'on' : ''} onClick={() => chooseColor(c)} aria-label={c}><ProductImage src={pickImage(p, c)} type={p.type} color={c} /></button>)}</div>
        )}
      </div>
      <div className="pd-info">
        <h2>{p.name}</h2>
        <Stars green value={p.rating} reviews={p.reviews} label=" reviews" />
        <div className="price-row"><b>EGP {price}</b>{p.oldPrice && <><s>EGP {p.oldPrice}</s><em>{off}% OFF</em></>}</div>
        <div className="label">Color: <b>{color}</b></div>
        <div className="swatches">{p.colors.map((c) => <button key={c} aria-label={c} aria-pressed={c === color} className={c === color ? 'on' : ''} style={{ background: COLORS[c] || c }} onClick={() => chooseColor(c)} />)}</div>
        <div className="label">Size: <b>{size}</b></div>
        <div className="sizes">{p.sizes.map((s) => <button key={s} className={s === size ? 'on' : ''} disabled={!!p.variants && !(variantOf(color, s)?.stock > 0)} onClick={() => setSize(s)}>{s}</button>)}</div>
        <div className="pd-cta">
          <button ref={btn} className={`btn btn-dark ${added ? 'btn-added' : ''}`} disabled={soldOut} onClick={added ? () => nav('/cart') : addToCart}>{soldOut ? 'Out of stock' : added ? 'Added ✓  View cart' : 'Add to Cart'}</button>
          <button className="btn btn-ghost sq" aria-label="Wishlist" onClick={() => toggle(p._id)}><Icon name="heart" fill={fav ? '#e5365b' : 'none'} /></button>
        </div>
      </div>
      {fly && <span className="fly" style={{ left: fly.x, top: fly.y, '--dx': `${fly.dx}px`, '--dy': `${fly.dy}px` }} />}
    </div>
  )
}
