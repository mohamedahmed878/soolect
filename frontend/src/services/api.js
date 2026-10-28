import axios from 'axios'
import { mockProducts } from '../data/mockData'

const BASE = import.meta.env.VITE_API_URL
export const isMock = !BASE

const http = axios.create({ baseURL: BASE ? `${BASE.replace(/\/$/, '')}/api` : undefined, timeout: 12000 })
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('soalect_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

/* ---------- Demo mode (no backend yet): data lives in localStorage ---------- */
const ls = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
}
const delay = (v) => new Promise((r) => setTimeout(() => r(v), 250))

const shortName = (n = '') => { const p = String(n).trim().split(/\s+/).filter(Boolean); return !p.length ? 'Customer' : p.length === 1 ? p[0] : `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` }
const mockUserId = () => { const t = localStorage.getItem('soalect_token') || ''; return ls.get('mock_users', []).find((x) => 'mock-' + x._id === t)?._id }
const reviewStats = (list) => {
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  list.forEach((r) => { breakdown[r.rating] += 1 })
  const count = list.length
  const average = count ? Math.round((list.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : 0
  return { count, average, breakdown, reviews: list.slice(0, 12).map(({ userId, ...r }) => r) }
}

const mock = {
  products: () => delay(mockProducts),
  product: (id) => delay(mockProducts.find((p) => p._id === id)),
  register: ({ name, email, phone, password }) => {
    const users = ls.get('mock_users', [])
    if (users.some((u) => u.email === email)) return Promise.reject(new Error('Email already registered'))
    const user = { _id: 'u' + Date.now(), name, email, phone, password }
    ls.set('mock_users', [...users, user])
    const { password: _, ...safe } = user
    return delay({ token: 'mock-' + user._id, user: safe })
  },
  login: ({ email, password }) => {
    const u = ls.get('mock_users', []).find((x) => x.email === email && x.password === password)
    if (!u) return Promise.reject(new Error('Wrong email or password'))
    const { password: _, ...safe } = u
    return delay({ token: 'mock-' + u._id, user: safe })
  },
  me: () => {
    const t = localStorage.getItem('soalect_token') || ''
    const u = ls.get('mock_users', []).find((x) => 'mock-' + x._id === t)
    if (!u) return Promise.reject(new Error('no session'))
    const { password: _, ...safe } = u
    return delay(safe)
  },
  reviews: () => delay(reviewStats(ls.get('mock_reviews', []))),
  myReview: () => {
    const id = mockUserId()
    const r = id && ls.get('mock_reviews', []).find((x) => x.userId === id)
    return delay(r ? { _id: r._id, rating: r.rating, comment: r.comment } : null)
  },
  saveReview: ({ rating, comment }) => {
    const t = localStorage.getItem('soalect_token') || ''
    const u = ls.get('mock_users', []).find((x) => 'mock-' + x._id === t)
    if (!u) return Promise.reject(new Error('Please log in'))
    const rest = ls.get('mock_reviews', []).filter((x) => x.userId !== u._id)
    const r = { _id: 'r' + Date.now(), userId: u._id, name: shortName(u.name), rating: Number(rating), comment: String(comment || '').trim().slice(0, 500), createdAt: new Date().toISOString() }
    ls.set('mock_reviews', [r, ...rest])
    return delay({ _id: r._id, rating: r.rating, comment: r.comment })
  },
  createOrder: (payload) => {
    const orders = ls.get('mock_orders', [])
    const order = {
      _id: 'o' + Date.now(), number: 'SO' + Math.floor(10000 + Math.random() * 89999),
      status: 'processing', createdAt: new Date().toISOString(), accessToken: 'mock',
      timeline: [{ status: 'placed', at: new Date().toISOString() }, { status: 'processing', at: new Date().toISOString() }], ...payload,
    }
    ls.set('mock_orders', [order, ...orders])
    return delay(order)
  },
  orders: () => delay(ls.get('mock_orders', [])),
  order: (id) => delay(ls.get('mock_orders', []).find((o) => o._id === id)),
  cancelOrder: (id) => {
    const all = ls.get('mock_orders', [])
    const o = all.find((x) => x._id === id)
    if (!o) return Promise.reject(new Error('Order not found'))
    if (o.status !== 'processing') return Promise.reject(new Error('This order can no longer be cancelled'))
    o.status = 'cancelled'; o.timeline = [...(o.timeline || []), { status: 'cancelled', at: new Date().toISOString() }]
    ls.set('mock_orders', all)
    return delay(o)
  },
  track: ({ number, phone }) => {
    const key = (v) => String(v || '').replace(/\D/g, '').slice(-10)
    const n = String(number || '').trim().toUpperCase().replace(/^#/, '')
    const o = ls.get('mock_orders', []).find((x) => x.number === n && key(x.contact?.phone) === key(phone))
    return o ? delay(o) : Promise.reject(new Error('No order found with that number and phone'))
  },
}

/* Guests have no account, so the browser remembers each order's id + secret token to show them in "My Orders". */
const GUEST_KEY = 'soalect_guest_orders'
const guest = {
  list: () => ls.get(GUEST_KEY, []),
  remember: (o) => {
    if (!o?.accessToken) return
    const rest = guest.list().filter((g) => g._id !== o._id)
    ls.set(GUEST_KEY, [{ _id: o._id, number: o.number, token: o.accessToken }, ...rest].slice(0, 20))
  },
}
const loggedIn = () => !!localStorage.getItem('soalect_token')

/* Marketer referral: `/?ref=CODE` is remembered for 30 days and sent with the order. */
const REF_KEY = 'soalect_ref'
const REF_DAYS = 30
export const referral = {
  capture: (search) => {
    const code = new URLSearchParams(search).get('ref')?.trim().toUpperCase().slice(0, 20)
    if (code && /^[A-Z0-9_-]{3,20}$/.test(code)) ls.set(REF_KEY, { code, at: Date.now() })
  },
  get: () => {
    const r = ls.get(REF_KEY, null)
    return r?.code && Date.now() - r.at < REF_DAYS * 864e5 ? r.code : undefined
  },
}

/* ---------- Public API used by the app ---------- */
export const api = {
  getProducts: () => (isMock ? mock.products() : http.get('/products').then((r) => r.data)),
  getProduct: (id) => (isMock ? mock.product(id) : http.get(`/products/${id}`).then((r) => r.data)),
  register: (d) => (isMock ? mock.register(d) : http.post('/auth/register', d).then((r) => r.data)),
  login: (d) => (isMock ? mock.login(d) : http.post('/auth/login', d).then((r) => r.data)),
  me: () => (isMock ? mock.me() : http.get('/auth/me').then((r) => r.data)),
  createOrder: (d) => (isMock ? mock.createOrder(d) : http.post('/orders', { ...d, refCode: referral.get() }).then((r) => { if (!loggedIn()) guest.remember(r.data); return r.data })),
  getMyOrders: () => {
    if (isMock) return mock.orders()
    if (loggedIn()) return http.get('/orders/my').then((r) => r.data)
    return Promise.all(guest.list().map((g) => http.get(`/orders/${g._id}`, { params: { token: g.token } }).then((r) => r.data).catch(() => null))).then((l) => l.filter(Boolean))
  },
  cancelOrder: (id, token) => (isMock ? mock.cancelOrder(id) : http.post(`/orders/${id}/cancel`, { token }).then((r) => r.data)),
  getOrder: (id, token) => (isMock ? mock.order(id) : http.get(`/orders/${id}`, { params: token ? { token } : undefined }).then((r) => r.data)),
  trackOrder: (d) => (isMock ? mock.track(d) : http.post('/orders/track', d).then((r) => { if (!loggedIn()) guest.remember(r.data); return r.data })),
  getReviews: () => (isMock ? mock.reviews() : http.get('/reviews').then((r) => r.data)),
  getMyReview: () => (isMock ? mock.myReview() : http.get('/reviews/mine').then((r) => r.data)),
  saveReview: (d) => (isMock ? mock.saveReview(d) : http.post('/reviews', d).then((r) => r.data)),
  validateCoupon: (code, subtotal) => http.post('/coupons/validate', { code, subtotal }).then((r) => r.data),

}

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong'
