import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { errMsg } from '../api'
import { useAuth } from '../auth'
import { ErrorBox, Field } from '../ui'

export default function Login() {
  const { admin, loading, login } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && admin) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await login(f.email.trim(), f.password); nav('/', { replace: true }) }
    catch (x) { setErr(errMsg(x)) } finally { setBusy(false) }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <b className="brand">SOOLECT <i>Admin</i></b>
        <p className="muted">Sign in with the admin account.</p>
        <Field label="Email"><input required type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input required type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <ErrorBox>{err}</ErrorBox>
        <button className="btn dark block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
