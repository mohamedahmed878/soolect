import { useAuth } from '../context/AuthContext'
import usePusherEvent from './usePusherEvent'

// Listens for admin changes (status updates) pushed by the backend through Pusher.
// Channel:  orders-<userId>   |   Event: order-updated   |   Payload: the full updated order
export default function useLiveOrders(onUpdate) {
  const { user } = useAuth()
  usePusherEvent(user ? `orders-${user._id}` : null, 'order-updated', onUpdate)
}
