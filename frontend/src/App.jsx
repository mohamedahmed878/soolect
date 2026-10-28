import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmed from './pages/OrderConfirmed'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Account from './pages/Account'
import Search from './pages/Search'
import Auth from './pages/Auth'

// Guests must register/login before ordering or viewing orders.
function Protected({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="center muted">Loading…</div>
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="search" element={<Search />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="checkout" element={<Protected><Checkout /></Protected>} />
        <Route path="order-confirmed/:id" element={<Protected><OrderConfirmed /></Protected>} />
        <Route path="orders" element={<Protected><Orders /></Protected>} />
        <Route path="orders/:id" element={<Protected><OrderDetails /></Protected>} />
        <Route path="account" element={<Protected><Account /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
