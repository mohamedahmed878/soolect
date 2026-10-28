import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { PageBar } from '../components/Layout'
import { useAuth } from '../context/AuthContext'

const ROWS = [['orders', 'My Orders', '/orders'], ['pin', 'Addresses', '/addresses'], ['card', 'Payment Methods'], ['heart', 'Wishlist', '/wishlist'], ['cog', 'Settings']]

export default function Account() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <>
      <PageBar title="My Account" back={false} />
      <div className="profile"><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><div><b>{user.name}</b><span className="muted">{user.email}</span></div></div>
      <ul className="menu">
        {ROWS.map(([ic, l, to], n) => <li key={l} style={{ '--i': n }}>{to ? <Link to={to}><Icon name={ic} /><span>{l}</span><Icon name="chevron" size={16} /></Link> : <button disabled title="Coming soon"><Icon name={ic} /><span>{l}</span><Icon name="chevron" size={16} /></button>}</li>)}
        {user.role === 'admin' && <li style={{ '--i': ROWS.length }}><Link to="/admin/affiliates"><Icon name="user" /><span>Marketers &amp; commissions</span><Icon name="chevron" size={16} /></Link></li>}
        <li><button onClick={() => { logout(); nav('/') }}><Icon name="logout" /><span>Log Out</span></button></li>
      </ul>
    </>
  )
}
