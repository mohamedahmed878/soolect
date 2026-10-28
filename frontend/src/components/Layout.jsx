import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { useSearch } from '../context/SearchContext'

const LogoMark = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 5h11a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h11" /><path d="M4 9h6M14 17h6" opacity=".6" /></svg>)

export function Header() {
  const { count } = useCart()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const search = useSearch()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [pathname])
  return (
    <>
      <header className={`header ${pathname === '/' ? 'over' : ''}`}>
        <Link to="/" className="logo"><LogoMark />SOALECT</Link>
        <nav className="header-links"><NavLink to="/" end>Home</NavLink><NavLink to="/shop">Shop</NavLink><NavLink to="/orders">Orders</NavLink><NavLink to="/account">Account</NavLink></nav>
        <div className="header-actions">
          <button aria-label="Search" onClick={search.open}><Icon name="search" size={19} /></button>
          <button aria-label="Cart" onClick={() => nav('/cart')}><Icon name="bag" size={19} />{count > 0 && <b key={count} className="badge">{count}</b>}</button>
          <button aria-label="Toggle theme" className="theme-btn" onClick={toggle}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} /></button>
          <button aria-label="Menu" className="menu-btn" onClick={() => setOpen(true)}><Icon name="menu" size={20} /></button>
        </div>
      </header>
      {open && (<>
        <div className="drawer-bg" onClick={() => setOpen(false)} />
        <aside className="drawer" aria-label="Menu">
          <Link to="/"><Icon name="home" /> Home</Link><Link to="/shop"><Icon name="shop" /> Shop</Link>
          <Link to="/orders"><Icon name="orders" /> My Orders</Link><Link to="/account"><Icon name="user" /> Account</Link>
          <button onClick={toggle}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /> {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
        </aside>
      </>)}
    </>
  )
}

export function BottomNav() {
  const { count } = useCart()
  const it = (to, icon, label, end) => (
    <NavLink to={to} end={end} className="bn-item"><span className="bn-ico"><Icon name={icon} size={21} />{icon === 'bag' && count > 0 && <b key={count} className="badge">{count}</b>}</span>{label}</NavLink>
  )
  return <nav className="bottom-nav">{it('/', 'home', 'Home', true)}{it('/shop', 'shop', 'Shop')}{it('/cart', 'bag', 'Cart')}{it('/account', 'user', 'Account')}</nav>
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (<div className="app"><Header /><main className="page" key={pathname}><Outlet /></main><BottomNav /></div>)
}

export function PageBar({ title, back = true, right }) {
  const nav = useNavigate()
  return (
    <div className="pagebar">
      {back && <button aria-label="Back" onClick={() => nav(-1)}><Icon name="back" /></button>}
      <h1>{title}</h1><div className="pagebar-right">{right}</div>
    </div>
  )
}
