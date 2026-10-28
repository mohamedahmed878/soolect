import { Link, useLocation, useParams } from 'react-router-dom'
import Icon from '../components/Icon'

export default function OrderConfirmed() {
  const { id } = useParams()
  const { state } = useLocation()
  return (
    <div className="confirm">
      <span className="tick"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg></span>
      <h2>Order Confirmed!</h2>
      <p className="muted">Your order {state?.number ? `#${state.number} ` : ''}has been placed successfully.</p>
      <Link className="btn btn-dark block" to={`/orders/${id}`}>View Order Details</Link>
      <Link className="btn btn-ghost block" to="/shop">Continue Shopping</Link>
      <p className="muted small">You will receive an email with your order details and tracking information.</p>
    </div>
  )
}
