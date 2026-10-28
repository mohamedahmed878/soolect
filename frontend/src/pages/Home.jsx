import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import useProducts from '../hooks/useProducts'
import { api, errMsg } from '../services/api'

// Placeholder hero scene. Drop a real photo at /public/hero.jpg and it is used automatically.
const Scene = () => (
  <svg className="scene" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1626" /><stop offset=".55" stopColor="#274866" /><stop offset="1" stopColor="#6d8ea6" /></linearGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d5f7c" /><stop offset="1" stopColor="#0e1a28" /></linearGradient>
    </defs>
    <rect width="400" height="360" fill="url(#sky)" /><rect y="190" width="400" height="170" fill="url(#sea)" />
    <path d="M0 215q60-30 120-8t140-6 140 14V360H0Z" fill="#14202e" opacity=".8" />
    <path d="M110 360c-6-60 4-90 40-104l26-10h48l26 10c36 14 46 44 40 104Z" fill="#0b0f15" />
    <path d="M168 246q32 26 64 0l-6-26h-52Z" fill="#c08a6a" /><ellipse cx="200" cy="190" rx="34" ry="42" fill="#cd966f" />
    <path d="M166 176q34-34 68 0 0-26-34-30t-34 30Z" fill="#12100e" />
    <path d="M170 184h26v14q-13 4-26-2Zm34 0h26v12q-13 6-26 2Z" fill="#06080b" /><path d="M196 188h8" stroke="#06080b" strokeWidth="3" />
    <path d="M176 224q24 14 48 0" stroke="#7e4f38" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M150 268q50 26 100 0" stroke="#1b2430" strokeWidth="3" fill="none" />
  </svg>
)

const Rate = ({ value = 0, size = 14 }) => (
  <span className="rv-stars" role="img" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" size={size} stroke={0} fill={n <= Math.round(value) ? 'currentColor' : 'var(--line)'} />)}
  </span>
)

const dateOf = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// Customer opinions shown at the bottom of the homepage (no separate page). Logged-in customers can add or edit theirs.
function Reviews() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [mine, setMine] = useState(null)
  const [form, setForm] = useState({ rating: 0, comment: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = () => api.getReviews().then(setData).catch(() => setData({ count: 0, average: 0, breakdown: {}, reviews: [] }))
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!user) { setMine(null); return }
    api.getMyReview().then((r) => { setMine(r); if (r) setForm({ rating: r.rating, comment: r.comment || '' }) }).catch(() => {})
  }, [user?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg('')
    if (!form.rating) { setErr('Please choose a star rating'); return }
    setBusy(true)
    try {
      const saved = await api.saveReview(form)
      setMine(saved); setMsg(mine ? 'Your review was updated. Thank you!' : 'Thank you for your review!')
      load()
    } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  const total = data?.count || 0

  return (
    <section className="reviews" id="reviews" aria-label="Customer reviews">
      <div className="block-head"><h3>What customers say</h3></div>

      {data && total > 0 && (
        <div className="rv-summary">
          <div className="rv-score"><b>{data.average.toFixed(1)}</b><Rate value={data.average} size={16} /><small>{total} {total === 1 ? 'review' : 'reviews'}</small></div>
          <ul className="rv-bars" aria-label="Rating breakdown">
            {[5, 4, 3, 2, 1].map((n) => (
              <li key={n}><span>{n}</span><i><u style={{ width: `${((data.breakdown?.[n] || 0) / total) * 100}%` }} /></i><em>{data.breakdown?.[n] || 0}</em></li>
            ))}
          </ul>
        </div>
      )}

      {!data ? <div className="skel rv-skel" /> : total === 0 ? (
        <p className="muted center small">No reviews yet. Be the first to share your opinion!</p>
      ) : (
        <ul className="rv-list">
          {data.reviews.map((r) => (
            <li key={r._id} className="rv-card">
              <div className="rv-top"><b>{r.name}</b><small className="muted">{dateOf(r.createdAt)}</small></div>
              <Rate value={r.rating} />
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="rv-write">
        {user ? (
          <form onSubmit={submit}>
            <h4>{mine ? 'Edit your review' : 'Rate our clothes'}</h4>
            <div className="rv-pick" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} role="radio" aria-checked={form.rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= form.rating ? 'on' : ''} onClick={() => setForm({ ...form, rating: n })}>
                  <Icon name="star" size={28} stroke={0} fill={n <= form.rating ? 'currentColor' : 'var(--line)'} />
                </button>
              ))}
            </div>
            <textarea className="rv-text" rows={3} maxLength={500} placeholder="Tell others what you think (optional)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            {err && <p className="error">{err}</p>}
            {msg && <p className="notice">{msg}</p>}
            <button className="btn btn-dark block" disabled={busy}>{busy ? 'Sending…' : mine ? 'Update review' : 'Submit review'}</button>
          </form>
        ) : (
          <p className="center small muted"><Link className="link" to="/login?next=%2F">Log in</Link> or <Link className="link" to="/register?next=%2F">create an account</Link> to rate our clothes.</p>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const { products, loading, error, reload } = useProducts()
  return (
    <>
      <section className="hero">
        <Scene />
        <div className="hero-ghost">SOOLECT</div>
        <div className="hero-copy">
          <h2>Wear<br />Your Story</h2>
          <p>Premium streetwear for modern thinkers. Quality. Comfort. Identity.</p>
          <Link to="/shop" className="btn btn-light btn-sm">Shop Now <Icon name="chevron" size={14} /></Link>
        </div>
      </section>
      <section className="perks">
        <div><Icon name="truck" /><b>Free Shipping</b>Over 1000 EGP</div>
        <div><Icon name="shield" /><b>Secure Payment</b>100% Safe</div>
        <div><Icon name="returns" /><b>Easy Returns</b>Within 14 Days</div>
      </section>
      <div className="block-head"><h3>Featured Products</h3><Link to="/shop">View all</Link></div>
      {error && <p className="center error">{error} <button className="link" onClick={reload}>Retry</button></p>}
      <div className="grid">{loading ? [0, 1, 2, 3].map((n) => <div key={n} className="skel card" />) : products.slice(0, 4).map((p, i) => <ProductCard key={p._id} p={p} i={i} />)}</div>
      <Reviews />
    </>
  )
}
