import Pusher from 'pusher'
import { env } from '../config/env.js'

let client
function getClient() {
  const cfg = env.pusher
  if (!cfg) return null
  if (!client) client = new Pusher({ appId: cfg.appId, key: cfg.key, secret: cfg.secret, cluster: cfg.cluster, useTLS: true })
  return client
}

// Tell the customer's open tabs that their order changed. Never throws: a Pusher outage must not fail an admin action.
export async function publishOrderUpdate(order) {
  try {
    const pusher = getClient()
    if (!pusher || !order.userId) return // guests have no channel
    await pusher.trigger(`orders-${order.userId}`, 'order-updated', order.toJSON ? order.toJSON() : order)
  } catch (e) {
    console.error('Pusher publish failed:', e.message)
  }
}
