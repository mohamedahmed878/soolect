import { useId } from 'react'
import { COLORS } from '../data/mockData'

// Vector product render (shaded). Real photos from the backend replace this via product.images.
export default function Garment({ type = 'hoodie', color = 'black', className = '' }) {
  const id = useId().replace(/:/g, '')
  const fill = COLORS[color] || color
  const light = ['white', 'beige', 'grey'].includes(color)
  const ink = light ? '#1b1f24' : '#e9ecef'
  return (
    <svg viewBox="0 0 200 220" className={`garment ${className}`} role="img" aria-label={`${type} ${color}`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".16" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".22" /></linearGradient>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity=".18" /><stop offset=".3" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".14" /></linearGradient>
      </defs>
      {type === 'hoodie' && (<>
        <path d="M60 40 30 54Q18 60 14 92L9 152Q9 160 18 160l18 1 5-42 1 79q0 6 6 6h104q6 0 6-6l1-79 5 42 18-1q9 0 9-8l-5-60q-4-32-16-38L140 40Z" fill={fill} />
        <path d="M66 38Q100 4 134 38Q130 62 100 68 70 62 66 38Z" fill={fill} /><path d="M66 38Q100 4 134 38Q130 62 100 68 70 62 66 38Z" fill="#000" opacity=".18" />
        <path d="M78 42Q100 22 122 42Q118 58 100 62 82 58 78 42Z" fill="#000" opacity={light ? '.35' : '.55'} />
        <path d="M88 62l-3 34M112 62l3 34" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />
        <path d="M64 146h72l9 36H55Z" fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="1.6" />
        <path d="M44 150h112" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
        <path d="M18 156q10 4 20 3M182 156q-10 4-20 3" stroke="#000" strokeOpacity=".2" strokeWidth="3" fill="none" />
        <path d="M60 40 30 54Q18 60 14 92L9 152Q9 160 18 160l18 1 5-42 1 79q0 6 6 6h104q6 0 6-6l1-79 5 42 18-1q9 0 9-8l-5-60q-4-32-16-38L140 40Z" fill={`url(#g${id})`} />
        <path d="M60 40 30 54Q18 60 14 92L9 152Q9 160 18 160l18 1 5-42 1 79q0 6 6 6h104q6 0 6-6l1-79 5 42 18-1q9 0 9-8l-5-60q-4-32-16-38L140 40Z" fill={`url(#v${id})`} />
      </>)}
      {type === 'tee' && (<>
        <path d="M70 30Q100 46 130 30l52 24-16 44-26-8v118H60V90l-26 8L18 54Z" fill={fill} />
        <path d="M70 30Q100 46 130 30l52 24-16 44-26-8v118H60V90l-26 8L18 54Z" fill={`url(#g${id})`} /><path d="M70 30Q100 46 130 30l52 24-16 44-26-8v118H60V90l-26 8L18 54Z" fill={`url(#v${id})`} />
        <path d="M70 30Q100 52 130 30" fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="4" />
      </>)}
      {type === 'cap' && (<>
        <path d="M38 132C38 76 68 56 100 56s62 20 62 76Z" fill={fill} /><path d="M26 132h148c0 14-32 24-74 24s-74-10-74-24Z" fill={fill} />
        <path d="M38 132C38 76 68 56 100 56s62 20 62 76Z" fill={`url(#g${id})`} /><path d="M26 132h148c0 14-32 24-74 24s-74-10-74-24Z" fill="#000" opacity=".18" />
      </>)}
      <text x="100" y={type === 'cap' ? 108 : 112} textAnchor="middle" fontSize="8.5" letterSpacing="2.5" fill={ink} opacity=".7" fontWeight="600">SOALECT</text>
    </svg>
  )
}
