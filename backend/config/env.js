// Read lazily so a missing variable produces a clear error at request time, not at import time.
export const env = {
  get mongoUri() {
    const v = process.env.MONGODB_URI
    if (!v) throw new Error('MONGODB_URI is not set')
    return v
  },
  get jwtSecret() {
    const v = process.env.JWT_SECRET
    if (!v || v.length < 16) throw new Error('JWT_SECRET must be set (at least 16 characters)')
    return v
  },
  get adminEmail() { return (process.env.ADMIN_EMAIL || '').trim().toLowerCase() },
  get adminPassword() { return process.env.ADMIN_PASSWORD || '' },
  get clientOrigins() { return (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean) },
  get pusher() {
    const { PUSHER_APP_ID: appId, PUSHER_KEY: key, PUSHER_SECRET: secret, PUSHER_CLUSTER: cluster } = process.env
    return appId && key && secret && cluster ? { appId, key, secret, cluster } : null
  },
}
