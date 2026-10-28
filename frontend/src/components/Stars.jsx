import Icon from './Icon'
export default function Stars({ value = 0, reviews, green, label }) {
  return (
    <div className={`stars ${green ? 'g' : ''}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" size={11} stroke={0} fill={n <= Math.round(value) ? 'currentColor' : '#c9ced6'} />)}
      <small>{value}{reviews != null && ` (${reviews}${label || ''})`}</small>
    </div>
  )
}
