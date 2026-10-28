import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Garment from '../components/Garment'
import { PageBar } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useCart, SHIPPING_METHODS } from '../context/CartContext'
import { api, errMsg } from '../services/api'

const Logo = ({ k }) => ({
  card: <span className="paylogo"><b style={{ color: '#1a1f71', fontStyle: 'italic' }}>VISA</b><span className="mc"><i /><i /></span></span>,
  vodafone: <span className="vf">●</span>,
  cod: <span className="paylogo" style={{ color: 'var(--muted)' }}>EGP</span>,
  paypal: <span className="paylogo" style={{ fontStyle: 'italic' }}><span style={{ color: '#003087' }}>Pay</span><span style={{ color: '#009cde' }}>Pal</span></span>,
}[k])

const STEPS = ['Information', 'Shipping', 'Payment', 'Review']
const PAY = [['card', 'Credit / Debit Card'], ['vodafone', 'Vodafone Cash'], ['cod', 'Cash on Delivery'], ['paypal', 'PayPal']]

export default function Checkout() {
  const { user } = useAuth()
  const { items, subtotal, discount, clear } = useCart()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [info, setInfo] = useState({ email: user?.email || '', phone: user?.phone || '', fullName: user?.name || '', address: '', city: 'Alexandria', postal: '' })
  const [ship, setShip] = useState('standard')
  const [pay, setPay] = useState('cod')
  const [agree, setAgree] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const methods = SHIPPING_METHODS.filter((m) => !m.minSubtotal || subtotal >= m.minSubtotal)
  const shipping = methods.find((m) => m.id === ship) || methods[0]
  const shippingCost = subtotal >= 1000 ? 0 : shipping.price
  const total = subtotal - (discount?.amount || 0) + shippingCost
  const set = (k) => (e) => setInfo({ ...info, [k]: e.target.value })

  if (!items.length) { nav('/cart', { replace: true }); return null }

  const go = (e) => { e.preventDefault(); setStep((s) => s + 1); window.scrollTo(0, 0) }
  const place = async () => {
    setErr(''); setBusy(true)
    try {
      const order = await api.createOrder({
        items: items.map(({ productId, name, type, color, size, qty, price }) => ({ productId, name, type, color, size, qty, price })),
        contact: { email: info.email, phone: info.phone },
        address: { fullName: info.fullName, address: info.address, city: info.city, postal: info.postal },
        shippingMethod: shipping.id, paymentMethod: pay, discountCode: discount?.code,
        subtotal, shipping: shippingCost, total,
      })
      clear(); nav(`/order-confirmed/${order._id}`, { replace: true, state: { number: order.number } })
    } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  return (
    <>
      <PageBar title={step === 3 ? 'Review Your Order' : 'Checkout'} />
      <ol className="steps">{STEPS.slice(0, 3).map((s, i) => <li key={s} className={i === step || (step === 3 && i === 2) ? 'on' : i < step ? 'done' : ''}><i>{i < step && step !== 3 || (step === 3 && i < 2) ? '✓' : i + 1}</i>{s}</li>)}</ol>

      {step === 0 && (
        <form className="form step-in" onSubmit={go}>
          <h3>Contact Information</h3>
          <label className="fl"><span>Email</span><input required type="email" value={info.email} onChange={set('email')} /></label>
          <label className="fl"><span>Phone / WhatsApp</span><input required type="tel" value={info.phone} onChange={set('phone')} placeholder="+20 123 456 7890" /></label>
          <h3>Shipping Address</h3>
          <label className="fl"><span>Full Name</span><input required value={info.fullName} onChange={set('fullName')} /></label>
          <label className="fl"><span>Address</span><input required value={info.address} onChange={set('address')} /></label>
          <div className="row2"><label className="fl"><span>City</span><input required value={info.city} onChange={set('city')} /></label><label className="fl"><span>Postal Code</span><input value={info.postal} onChange={set('postal')} /></label></div>
          <button className="btn btn-dark block">Continue to Shipping</button>
        </form>
      )}

      {step === 1 && (
        <form className="form step-in" onSubmit={go}>
          <h3>Shipping Method</h3>
          {methods.map((m) => (
            <label key={m.id} className={`opt ${ship === m.id ? 'on' : ''}`}>
              <input type="radio" name="ship" checked={ship === m.id} onChange={() => setShip(m.id)} /><i className="radio" />
              <span className="t"><b>{m.label}</b><small>{m.days}</small></span><em>{m.price ? `EGP ${m.price}` : 'Free'}</em>
            </label>
          ))}
          <button className="btn btn-dark block">Continue to Payment</button>
        </form>
      )}

      {step === 2 && (
        <form className="form step-in" onSubmit={go}>
          <h3>Payment Method</h3>
          {PAY.map(([k, l]) => (
            <label key={k} className={`opt ${pay === k ? 'on' : ''}`}><input type="radio" name="pay" checked={pay === k} onChange={() => setPay(k)} /><i className="radio" /><span className="t"><b>{l}</b></span><Logo k={k} /></label>
          ))}
          <div className="btn-row"><button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button><button className="btn btn-dark">Complete Order</button></div>
        </form>
      )}

      {step === 3 && (
        <div className="form step-in">
          <h3>Order Summary</h3>
          <ul className="mini">{items.map((i) => <li key={`${i.productId}${i.color}${i.size}`}><div className="thumb sm"><Garment type={i.type} color={i.color} /></div><div><b>{i.name}</b><span className="muted">{i.color} / {i.size} · x{i.qty}</span></div><b>EGP {i.price * i.qty}</b></li>)}</ul>
          <dl className="sum"><div><dt>Subtotal</dt><dd>EGP {subtotal}</dd></div>{discount && <div><dt>Discount</dt><dd>- EGP {discount.amount}</dd></div>}<div><dt>Shipping</dt><dd>{shippingCost ? `EGP ${shippingCost}` : 'Free'}</dd></div><div className="total"><dt>Total</dt><dd>EGP {total}</dd></div></dl>
          <p className="muted small">Ship to {info.fullName}, {info.address}, {info.city} · Pay by {PAY.find((p) => p[0] === pay)[1]}</p>
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I agree to the <a>Terms &amp; Conditions</a> and <a>Privacy Policy</a></span></label>
          {err && <p className="error" role="alert">{err}</p>}
          <button className="btn btn-dark block" disabled={!agree || busy} onClick={place}>{busy ? 'Placing order…' : 'Place Order'}</button>
        </div>
      )}
    </>
  )
}
