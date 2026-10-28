import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProductImage, { pickImage } from '../components/ProductImage'
import Icon from '../components/Icon'
import useProducts from '../hooks/useProducts'

const SearchCtx = createContext(null)
export const useSearch = () => useContext(SearchCtx)

const SUGGESTIONS = ['hoodie', 'oversized', 't-shirt', 'cap', 'black', 'graphic']
const CATEGORIES = [['hoodies', 'Hoodies'], ['tshirts', 'T-Shirts'], ['accessories', 'Accessories']]

function SearchModal({ onClose }) {
  const { products } = useProducts()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(() => {
    if (!term) return []
    return products.filter((p) => [p.name, p.category, p.type, ...p.colors].join(' ').toLowerCase().includes(term))
  }, [products, term])

  const goCategory = (c) => { onClose(); nav(`/shop?cat=${c}`) }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.stopPropagation()}>
        <div className="searchfield modal-field">
          <Icon name="search" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hoodies, tees, caps" />
          <button aria-label="Close search" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        {!term && (
          <>
            <div className="label">Suggestions</div>
            <div className="chips">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
            <div className="label">Browse by category</div>
            <div className="chips">{CATEGORIES.map(([k, l]) => <button key={k} className="chip chip-solid" onClick={() => goCategory(k)}>{l}</button>)}</div>
          </>
        )}

        {term && (
          <ul className="results">
            {results.map((p) => (
              <li key={p._id}>
                <Link to={`/product/${p._id}`} onClick={onClose}>
                  <div className="thumb sm"><ProductImage src={pickImage(p, p.colors[0])} type={p.type} color={p.colors[0]} alt={p.name} /></div>
                  <div><b>{p.name}</b><span className="muted">EGP {p.price}</span></div>
                  <Icon name="chevron" size={16} />
                </Link>
              </li>
            ))}
            {!results.length && <p className="center muted">No products match “{q}”.</p>}
          </ul>
        )}
      </div>
    </div>
  )
}

export function SearchProvider({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const close = useCallback(() => setOpen(false), [])
  const show = useCallback(() => setOpen(true), [])
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <SearchCtx.Provider value={{ open: show, close }}>
      {children}
      {open && <SearchModal onClose={close} />}
    </SearchCtx.Provider>
  )
}
