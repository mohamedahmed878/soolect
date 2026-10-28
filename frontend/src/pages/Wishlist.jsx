import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { PageBar } from '../components/Layout'
import ProductCard from '../components/ProductCard'
import useProducts from '../hooks/useProducts'
import { useWishlist } from '../context/WishlistContext'

export default function Wishlist() {
  const { ids } = useWishlist()
  const { products, loading } = useProducts()
  const list = products.filter((p) => ids.includes(p._id))

  return (
    <>
      <PageBar title={`Wishlist${ids.length ? ` (${ids.length})` : ''}`} />
      {loading ? <p className="center muted">Loading…</p> : !list.length ? (
        <div className="empty"><Icon name="heart" size={42} /><p>Your wishlist is empty.</p><Link to="/shop" className="btn btn-dark">Browse products</Link></div>
      ) : (
        <div className="grid">{list.map((p, i) => <ProductCard key={p._id} p={p} i={i} />)}</div>
      )}
    </>
  )
}
