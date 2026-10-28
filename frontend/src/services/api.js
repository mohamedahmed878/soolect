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
  createOrder: (payload) => {
    const orders = ls.get('mock_orders', [])
    const order = {
      _id: 'o' + Date.now(), number: 'SO' + Math.floor(10000 + Math.random() * 89999),
      status: 'processing', createdAt: new Date().toISOString(),
      timeline: [{ status: 'placed', at: new Date().toISOString() }], ...payload,
    }
    ls.set('mock_orders', [order, ...orders])
    return delay(order)
  },
  orders: () => delay(ls.get('mock_orders', [])),
  order: (id) => delay(ls.get('mock_orders', []).find((o) => o._id === id)),
}

/* ---------- Public API used by the app ---------- */
export const api = {
  getProducts: () => (isMock ? mock.products() : http.get('/products').then((r) => r.data)),
  getProduct: (id) => (isMock ? mock.product(id) : http.get(`/products/${id}`).then((r) => r.data)),
  register: (d) => (isMock ? mock.register(d) : http.post('/auth/register', d).then((r) => r.data)),
  login: (d) => (isMock ? mock.login(d) : http.post('/auth/login', d).then((r) => r.data)),
  me: () => (isMock ? mock.me() : http.get('/auth/me').then((r) => r.data)),
  createOrder: (d) => (isMock ? mock.createOrder(d) : http.post('/orders', d).then((r) => r.data)),
  getMyOrders: () => (isMock ? mock.orders() : http.get('/orders/my').then((r) => r.data)),
  getOrder: (id) => (isMock ? mock.order(id) : http.get(`/orders/${id}`).then((r) => r.data)),
}

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong'
