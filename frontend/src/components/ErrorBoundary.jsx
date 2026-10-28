import { Component } from 'react'

// Shows the error on screen instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: 20, fontFamily: 'system-ui', color: '#111' }}>
        <h2>Something went wrong</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 13 }}>{String(this.state.error?.stack || this.state.error)}</pre>
        <button style={{ padding: '10px 16px', marginTop: 12 }} onClick={() => { localStorage.clear(); location.href = '/' }}>Clear saved data &amp; reload</button>
      </div>
    )
  }
}
