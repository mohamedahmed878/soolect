import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageBar } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../services/api'

export default function Auth({ mode }) {
  const isReg = mode === 'register'
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await (isReg ? register(f) : login({ email: f.email, password: f.password })); nav(next, { replace: true }) }
    catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  return (
    <>
      <PageBar title={isReg ? 'Create account' : 'Log in'} />
      <form className="form" onSubmit={submit}>
        {next !== '/' && <p className="notice">Log in or create an account to continue.</p>}
        {isReg && <label className="fl"><span>Full name</span><input required value={f.name} onChange={set('name')} autoComplete="name" /></label>}
        <label className="fl"><span>Email</span><input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        {isReg && <label className="fl"><span>WhatsApp number</span><input required type="tel" value={f.phone} onChange={set('phone')} placeholder="+20 1xx xxx xxxx" autoComplete="tel" /></label>}
        <label className="fl"><span>Password</span><input required type="password" minLength={6} value={f.password} onChange={set('password')} autoComplete={isReg ? 'new-password' : 'current-password'} /></label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn btn-dark block" disabled={busy}>{busy ? 'Please wait…' : isReg ? 'Create account' : 'Log in'}</button>
        <p className="muted center small">{isReg ? 'Already have an account?' : 'New to SOALECT?'} <Link className="link" to={`${isReg ? '/login' : '/register'}?next=${encodeURIComponent(next)}`}>{isReg ? 'Log in' : 'Create account'}</Link></p>
      </form>
    </>
  )
}
