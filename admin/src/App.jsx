import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { ThemeToggle } from './theme'
import Analytics from './pages/Analytics'
import Coupons from './pages/Coupons'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Marketers from './pages/Marketers'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Reviews from './pages/Reviews'

const NAV = [
  ['/', 'Dashboard', '▦', true],
  ['/analytics', 'Analytics', '◔'],
  ['/orders', 'Orders', '☰'],
  ['/products', 'Products', '◈'],
  ['/coupons', 'Coupons', '%'],
  ['/marketers', 'Marketers', '★'],
  ['/reviews', 'Reviews', '☆'],
]

function Shell() {
  const { admin, loading, logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])

  if (loading) return <div className="splash">Loading…</div>
  if (!admin) return <Navigate to="/login" replace />

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-btn" aria-label="Menu" onClick={() => setOpen((v) => !v)}>☰</button>
        <b className="brand">SOOLECT <i>Admin</i></b>
        <ThemeToggle />
      </header>
      <aside className={`side ${open ? 'open' : ''}`}>
        <b className="brand">SOOLECT <i>Admin</i></b>
        <nav>{NAV.map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}</nav>
        <div className="side-foot">
          <small className="muted">{admin.email}</small>
          <div className="row"><ThemeToggle full /><button className="btn ghost sm" onClick={logout}>Log out</button></div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <main className="main"><Outlet /></main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="marketers" element={<Marketers />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
