import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import useProducts from '../hooks/useProducts'

const TABS = [['all', 'All'], ['hoodies', 'Hoodies'], ['tshirts', 'T-Shirts'], ['accessories', 'Accessories']]

export default function Shop() {
  const { products, loading, error, reload } = useProducts()
  const [tab, setTab] = useState('all')
  const list = tab === 'all' ? products : products.filter((p) => p.category === tab)
  return (
    <>
      <Link to="/search" className="searchbar"><Icon name="search" size={16} /><span>Search for products...</span></Link>
      <div className="banner">
        <h3>New Collection SS/25</h3><span className="btn btn-light btn-sm">Shop Now</span><span className="arrow"><Icon name="chevron" size={12} /></span>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {error && <p className="center error">{error} <button className="link" onClick={reload}>Retry</button></p>}
      <div className="grid" key={tab}>{loading ? [0, 1, 2, 3].map((n) => <div key={n} className="skel card" />) : list.map((p, i) => <ProductCard key={p._id} p={p} i={i} />)}</div>
    </>
  )
}
