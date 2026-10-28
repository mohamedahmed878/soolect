import axios from 'axios'

// Empty = same origin (local dev goes through the Vite proxy). In production this is the store's address.
export const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const TOKEN_KEY = 'soolect_admin_token'

const http = axios.create({ baseURL: `${BASE}/api`, timeout: 20000 })

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// An expired or invalid token logs the admin out (a wrong password at the login form has no token yet, so it is not affected).
http.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
    localStorage.removeItem(TOKEN_KEY)
    window.dispatchEvent(new Event('admin-logout'))
  }
  return Promise.reject(e)
})

const data = (r) => r.data

export const api = {
  login: (email, password) => http.post('/auth/login', { email, password }).then(data),
  me: () => http.get('/auth/me').then(data),

  stats: () => http.get('/admin/stats').then(data),

  orders: (params) => http.get('/admin/orders', { params }).then(data),
  setOrderStatus: (id, status) => http.patch(`/admin/orders/${id}/status`, { status }).then(data),
  setPaymentStatus: (id, paymentStatus) => http.patch(`/admin/orders/${id}/payment`, { paymentStatus }).then(data),

  products: () => http.get('/admin/products').then(data),
  saveProduct: (id, body) => (id ? http.put(`/admin/products/${id}`, body) : http.post('/admin/products', body)).then(data),
  deleteProduct: (id) => http.delete(`/admin/products/${id}`).then(data),

  coupons: () => http.get('/admin/coupons').then(data),
  saveCoupon: (id, body) => (id ? http.put(`/admin/coupons/${id}`, body) : http.post('/admin/coupons', body)).then(data),
  deleteCoupon: (id) => http.delete(`/admin/coupons/${id}`).then(data),

  // Sends one already-compressed photo; returns { url } to store on the product.
  uploadImage: (blob) => http.post('/admin/images', blob, { headers: { 'Content-Type': blob.type }, timeout: 60000 }).then(data),

  analytics: (days) => http.get('/admin/analytics', { params: { days } }).then(data),

  reviews: () => http.get('/admin/reviews').then(data),
  deleteReview: (id) => http.delete(`/admin/reviews/${id}`).then(data),

  affiliates: () => http.get('/admin/affiliates').then(data),
  createAffiliate: (body) => http.post('/admin/affiliates', body).then(data),
  updateAffiliate: (id, body) => http.put(`/admin/affiliates/${id}`, body).then(data),
  deleteAffiliate: (id) => http.delete(`/admin/affiliates/${id}`).then(data),
  affiliateOrders: (id) => http.get(`/admin/affiliates/${id}/orders`).then(data),
  affiliatePayout: (id) => http.post(`/admin/affiliates/${id}/payout`).then(data),
}

export const errMsg = (e) => {
  if (e?.response?.data?.message) return e.response.data.message
  if (e?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check VITE_API_URL and that the store allows this site (CLIENT_ORIGIN).'
  return e?.message || 'Something went wrong'
}
