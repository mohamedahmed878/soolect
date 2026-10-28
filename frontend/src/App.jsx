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
import Wishlist from './pages/Wishlist'
import Addresses from './pages/Addresses'
import Auth from './pages/Auth'

// Only account-specific pages need a login. Guests can shop, check out and track orders.
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
        <Route path="search" element={<Navigate to="/shop" replace />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-confirmed/:id" element={<OrderConfirmed />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="account" element={<Protected><Account /></Protected>} />
        <Route path="addresses" element={<Protected><Addresses /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
