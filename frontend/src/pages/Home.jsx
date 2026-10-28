import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import useProducts from '../hooks/useProducts'

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

export default function Home() {
  const { products, loading, error, reload } = useProducts()
  return (
    <>
      <section className="hero">
        <Scene />
        <div className="hero-ghost">SOALECT</div>
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
    </>
  )
}
