import { useState } from 'react'
import { Link } from 'react-router-dom'
import Garment from '../components/Garment'
import Icon from '../components/Icon'
import { PageBar } from '../components/Layout'
import useProducts from '../hooks/useProducts'

export default function Search() {
  const { products } = useProducts()
  const [q, setQ] = useState('')
  const list = q.trim() ? products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())) : []
  return (
    <>
      <PageBar title="Search" />
      <div className="searchfield"><Icon name="search" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hoodies, tees, caps" />{q && <button aria-label="Clear" onClick={() => setQ('')}><Icon name="close" size={16} /></button>}</div>
      <ul className="results">
        {list.map((p) => (
          <li key={p._id}><Link to={`/product/${p._id}`}><div className="thumb sm"><Garment type={p.type} color={p.colors[0]} /></div><div><b>{p.name}</b><span className="muted">EGP {p.price}</span></div><Icon name="chevron" size={16} /></Link></li>
        ))}
      </ul>
      {q.trim() && !list.length && <p className="center muted">No products match “{q}”.</p>}
    </>
  )
}
