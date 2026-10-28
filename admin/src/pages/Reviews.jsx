import { useCallback, useEffect, useState } from 'react'
import { api, errMsg } from '../api'
import { Empty, ErrorBox, fmtDate, PageHead } from '../ui'

const Stars = ({ value }) => <span className="stars" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= value ? '' : 'off'}>★</span>)}</span>

export default function Reviews() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(() => api.reviews().then(setData).catch((e) => setErr(errMsg(e))), [])
  useEffect(() => { load() }, [load])

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.name}'s review? It disappears from the store homepage.`)) return
    setErr('')
    try { await api.deleteReview(r._id); load() } catch (e) { setErr(errMsg(e)) }
  }

  return (
    <>
      <PageHead title="Customer reviews" sub="What customers wrote on the store homepage. Delete anything inappropriate." />
      <ErrorBox>{err}</ErrorBox>
      <div className="tiles">
        <div className="tile"><small>Number of reviews</small><b>{data ? data.count : '…'}</b></div>
        <div className="tile"><small>Average rating</small><b>{data ? (data.count ? `${data.average.toFixed(1)} / 5` : '—') : '…'}</b></div>
      </div>
      {!data ? <Empty>Loading…</Empty> : data.reviews.length === 0 ? <Empty>No reviews yet.</Empty> : (
        <div className="tbl-wrap"><table>
          <thead><tr><th>Customer</th><th>Rating</th><th>Opinion</th><th>Date</th><th /></tr></thead>
          <tbody>{data.reviews.map((r) => (
            <tr key={r._id}>
              <td><b>{r.name}</b></td>
              <td><Stars value={r.rating} /></td>
              <td className="comment">{r.comment || <span className="muted">No comment</span>}</td>
              <td className="nowrap">{fmtDate(r.createdAt)}</td>
              <td><div className="row-actions"><button className="btn danger sm" onClick={() => remove(r)}>Delete</button></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  )
}
