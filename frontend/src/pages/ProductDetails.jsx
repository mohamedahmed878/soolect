import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Garment from '../components/Garment'
import Icon from '../components/Icon'
import Stars from '../components/Stars'
import { api } from '../services/api'
import { useCart } from '../context/CartContext'
import { COLORS } from '../data/mockData'

export default function ProductDetails() {
  const { id } = useParams()
  const nav = useNavigate()
  const { add } = useCart()
  const [p, setP] = useState(null)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [added, setAdded] = useState(false)
  const [fav, setFav] = useState(false)
  const [fly, setFly] = useState(null)
  const btn = useRef(null)

  useEffect(() => { api.getProduct(id).then((d) => { setP(d); setColor(d.colors[0]); setSize(d.sizes.includes('M') ? 'M' : d.sizes[0]) }) }, [id])
  if (!p) return <div className="pd-hero"><div className="skel" style={{ aspectRatio: 1 }} /></div>

  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const addToCart = () => {
    add({ productId: p._id, name: p.name, type: p.type, price: p.price, color, size })
    const r = btn.current.getBoundingClientRect()
    setFly({ x: r.left + r.width / 2, y: r.top, dx: window.innerWidth - r.left - r.width / 2 - 70, dy: -r.top + 28 })
    setAdded(true); setTimeout(() => { setAdded(false); setFly(null) }, 1500)
  }

  return (
    <div className="pd">
      <div className="pd-hero">
        <div className="pagebar">
          <button aria-label="Back" onClick={() => nav(-1)}><Icon name="back" /></button><h1>{p.name}</h1>
          <div className="pagebar-right"><button aria-label="Share" onClick={() => navigator.share?.({ title: p.name, url: location.href })}><Icon name="share" size={18} /></button><button aria-label="Wishlist" className={`heartbtn ${fav ? 'on' : ''}`} style={{ position: 'static', width: 34, height: 34 }} onClick={() => setFav(!fav)}><Icon name="heart" size={18} /></button></div>
        </div>
        <div className="pd-main"><Garment key={color} type={p.type} color={color} /></div>
        <div className="pd-thumbs">{p.colors.concat(p.colors).slice(0, 4).map((c, n) => <button key={n} className={c === color && n < p.colors.length ? 'on' : ''} onClick={() => setColor(c)} aria-label={c}><Garment type={p.type} color={c} /></button>)}</div>
      </div>
      <div className="pd-info">
        <h2>{p.name}</h2>
        <Stars green value={p.rating} reviews={p.reviews} label=" reviews" />
        <div className="price-row"><b>EGP {p.price}</b>{p.oldPrice && <><s>EGP {p.oldPrice}</s><em>{off}% OFF</em></>}</div>
        <div className="label">Color: <b>{color}</b></div>
        <div className="swatches">{p.colors.map((c) => <button key={c} aria-label={c} aria-pressed={c === color} className={c === color ? 'on' : ''} style={{ background: COLORS[c] }} onClick={() => setColor(c)} />)}</div>
        <div className="label">Size: <b>{size}</b></div>
        <div className="sizes">{p.sizes.map((s) => <button key={s} className={s === size ? 'on' : ''} onClick={() => setSize(s)}>{s}</button>)}</div>
        <div className="pd-cta">
          <button ref={btn} className={`btn btn-dark ${added ? 'btn-added' : ''}`} onClick={added ? () => nav('/cart') : addToCart}>{added ? 'Added ✓  View cart' : 'Add to Cart'}</button>
          <button className="btn btn-ghost sq" aria-label="Wishlist" onClick={() => setFav(!fav)}><Icon name="heart" fill={fav ? '#e5365b' : 'none'} /></button>
        </div>
      </div>
      {fly && <span className="fly" style={{ left: fly.x, top: fly.y, '--dx': `${fly.dx}px`, '--dy': `${fly.dy}px` }} />}
    </div>
  )
}
