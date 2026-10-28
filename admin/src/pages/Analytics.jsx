import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errMsg } from '../api'
import { egp, Empty, ErrorBox, PageHead, PAY_METHOD, STATUS } from '../ui'

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']]
const num = (n) => Math.round(Number(n) || 0).toLocaleString('en-US')
const short = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const compact = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}k` : String(Math.round(v)))
const niceMax = (v) => { const e = 10 ** Math.floor(Math.log10(v)); const n = v / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * e }

// Change versus the previous period of the same length.
function Delta({ v }) {
  if (v === null || v === undefined) return <span className="delta">New<em>vs previous period</em></span>
  const up = v > 0, down = v < 0
  return <span className={`delta ${up ? 'up' : down ? 'down' : ''}`}>{up ? '▲' : down ? '▼' : '•'} {Math.abs(v)}%<em>vs previous period</em></span>
}

function Tile({ label, value, change }) {
  return <div className="tile"><small>{label}</small><b>{value}</b>{change !== undefined && <Delta v={change} />}</div>
}

function LineChart({ series, metric }) {
  const [hover, setHover] = useState(null)
  const W = 720, H = 250, P = { l: 48, r: 14, t: 14, b: 28 }
  const n = series.length
  const max = niceMax(Math.max(...series.map((d) => d[metric]), 1))
  const x = (i) => P.l + (n === 1 ? 0 : (i * (W - P.l - P.r)) / (n - 1))
  const y = (v) => P.t + (H - P.t - P.b) * (1 - v / max)
  const line = series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[metric]).toFixed(1)}`).join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)} ${H - P.b} L${x(0).toFixed(1)} ${H - P.b} Z`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => max * t)
  const labelAt = [...new Set([0, 1, 2, 3, 4, 5].map((k) => Math.round((k * (n - 1)) / 5)))]

  const move = (e) => {
    const pt = e.touches ? e.touches[0] : e
    const r = e.currentTarget.getBoundingClientRect()
    const rel = ((pt.clientX - r.left) / r.width) * W
    const step = n === 1 ? 1 : (W - P.l - P.r) / (n - 1)
    setHover(Math.max(0, Math.min(n - 1, Math.round((rel - P.l) / step))))
  }
  const h = hover !== null ? series[hover] : null

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metric} over time`} onMouseMove={move} onTouchMove={move} onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}><line className="grid" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} /><text className="axis" x={P.l - 8} y={y(t) + 4} textAnchor="end">{compact(t)}</text></g>
        ))}
        {labelAt.map((i) => <text key={i} className="axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{short(series[i].date)}</text>)}
        <path className="area" d={area} />
        <path className="line" d={line} />
        {h && <><line className="cursor" x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} /><circle className="dot" cx={x(hover)} cy={y(h[metric])} r="4.5" /></>}
      </svg>
      {h && (
        <div className="tip" style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}>
          <b>{short(h.date)}</b>{metric === 'sales' ? egp(h.sales) : `${h.orders} order${h.orders === 1 ? '' : 's'}`}
          <br />{metric === 'sales' ? `${h.orders} order${h.orders === 1 ? '' : 's'}` : egp(h.sales)}
        </div>
      )}
    </div>
  )
}

function Bars({ rows, value, label, sub, format = egp }) {
  const max = Math.max(...rows.map(value), 1)
  return (
    <div className="bars">{rows.map((r, i) => (
      <div className="bar-row" key={i}>
        <div className="bar-top"><span>{label(r)}</span><b>{format(value(r))}</b></div>
        <div className="bar"><i style={{ width: `${(value(r) / max) * 100}%` }} /></div>
        {sub && <div className="bar-sub">{sub(r)}</div>}
      </div>
    ))}</div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [d, setD] = useState(null)
  const [metric, setMetric] = useState('sales')
  const [err, setErr] = useState('')

  useEffect(() => {
    let live = true
    setErr('')
    api.analytics(days).then((r) => { if (live) setD(r) }).catch((e) => { if (live) setErr(errMsg(e)) })
    return () => { live = false }
  }, [days])

  const t = d?.totals
  const statusTotal = d ? Object.values(d.statuses).reduce((a, b) => a + b, 0) : 0

  return (
    <>
      <PageHead title="Analytics" sub="Sales and customer trends, compared with the previous period." />
      <ErrorBox>{err}</ErrorBox>
      <div className="tabs range">{RANGES.map(([v, label]) => <button key={v} className={`tab ${days === v ? 'on' : ''}`} onClick={() => setDays(v)}>{label}</button>)}</div>

      <div className="tiles">
        <Tile label="Total sales" value={t ? egp(t.sales) : '…'} change={t?.change.sales} />
        <Tile label="Orders" value={t ? num(t.orders) : '…'} change={t?.change.orders} />
        <Tile label="Average order value" value={t ? egp(t.aov) : '…'} change={t?.change.aov} />
        <Tile label="New customers" value={t ? num(t.newCustomers) : '…'} change={t?.change.customers} />
        <Tile label="Items sold" value={t ? num(t.units) : '…'} />
        <Tile label="Discounts given" value={t ? egp(t.discounts) : '…'} />
        <Tile label="Cancelled orders" value={t ? num(t.cancelled) : '…'} />
      </div>

      <section className="card chart-card">
        <div className="chart-head">
          <h3>{metric === 'sales' ? 'Sales over time' : 'Orders over time'}</h3>
          <div className="seg"><button className={metric === 'sales' ? 'on' : ''} onClick={() => setMetric('sales')}>Sales</button><button className={metric === 'orders' ? 'on' : ''} onClick={() => setMetric('orders')}>Orders</button></div>
        </div>
        {d ? <LineChart series={d.series} metric={metric} /> : <Empty>Loading…</Empty>}
      </section>

      <div className="cols2">
        <section className="card">
          <h3>Top products</h3>
          {!d ? <Empty>Loading…</Empty> : d.topProducts.length === 0 ? <Empty>No sales in this period.</Empty> : (
            <Bars rows={d.topProducts} value={(r) => r.revenue} label={(r) => r.name} sub={(r) => `${num(r.units)} sold`} />
          )}
        </section>
        <section className="card">
          <h3>Sales by city</h3>
          {!d ? <Empty>Loading…</Empty> : d.cities.length === 0 ? <Empty>No sales in this period.</Empty> : (
            <Bars rows={d.cities} value={(r) => r.sales} label={(r) => r.city} sub={(r) => `${num(r.orders)} order${r.orders === 1 ? '' : 's'}`} />
          )}
        </section>
      </div>

      <div className="cols2">
        <section className="card">
          <h3>Orders by status</h3>
          {!d || statusTotal === 0 ? <Empty>{d ? 'No orders in this period.' : 'Loading…'}</Empty> : (
            <>
              <div className="stack">{Object.keys(STATUS).map((s) => d.statuses[s] ? <i key={s} className={`c-${s}`} style={{ width: `${(d.statuses[s] / statusTotal) * 100}%` }} title={`${STATUS[s]}: ${d.statuses[s]}`} /> : null)}</div>
              <ul className="legend">{Object.keys(STATUS).map((s) => <li key={s}><span className={`dot-c c-${s}`} />{STATUS[s]}<em>{d.statuses[s] || 0}</em></li>)}</ul>
            </>
          )}
        </section>
        <section className="card">
          <h3>Payment methods</h3>
          {!d ? <Empty>Loading…</Empty> : d.payments.length === 0 ? <Empty>No sales in this period.</Empty> : (
            <Bars rows={d.payments} value={(r) => r.sales} label={(r) => PAY_METHOD[r.method] || r.method} sub={(r) => `${num(r.orders)} order${r.orders === 1 ? '' : 's'}`} />
          )}
        </section>
      </div>

      <section className="card">
        <h3>Customer reviews</h3>
        {!d ? <Empty>Loading…</Empty> : d.reviews.count === 0 ? <Empty>No reviews yet.</Empty> : (
          <div className="rating-big"><b>{d.reviews.average.toFixed(1)}</b><span className="stars" aria-label={`${d.reviews.average} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= Math.round(d.reviews.average) ? '' : 'off'}>★</span>)}</span><span className="muted">{d.reviews.count} review{d.reviews.count === 1 ? '' : 's'}</span><Link className="btn ghost sm" to="/reviews" style={{ marginInlineStart: 'auto' }}>Manage</Link></div>
        )}
      </section>
    </>
  )
}
