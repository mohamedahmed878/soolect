import { Link } from 'react-router-dom'
import Garment from './Garment'
import Icon from './Icon'
import Stars from './Stars'
import { useWishlist } from '../context/WishlistContext'

export default function ProductCard({ p, i = 0 }) {
  const { has, toggle } = useWishlist()
  const fav = has(p._id)
  return (
    <Link to={`/product/${p._id}`} className="pcard" style={{ '--i': i }}>
      <div className="pcard-img">
        <Garment type={p.type} color={p.colors[0]} />
        <button className={`heartbtn ${fav ? 'on' : ''}`} aria-label="Wishlist" onClick={(e) => { e.preventDefault(); toggle(p._id) }}><Icon name="heart" size={15} /></button>
      </div>
      <div className="pcard-name">{p.name}</div>
      <div className="pcard-sub">{p.colors[0][0].toUpperCase() + p.colors[0].slice(1)}</div>
      <div className="pcard-price">EGP {p.price}</div>
      <Stars value={p.rating} reviews={p.reviews} />
    </Link>
  )
}
