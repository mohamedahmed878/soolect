import Pusher from 'pusher-js'

let client = null
export function getPusher() {
  const key = import.meta.env.VITE_PUSHER_KEY
  if (!key) return null
  if (!client) client = new Pusher(key, { cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'eu' })
  return client
}
