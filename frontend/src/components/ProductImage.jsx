import { useEffect, useState } from 'react'
import Garment from './Garment'

// Uploaded photos are stored as /api/images/<id>; the store's API address (VITE_API_URL) is the same site.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const imgSrc = (u) => (!u ? '' : /^(https?:|data:|blob:)/i.test(u) ? u : `${BASE}${u}`)

// The photo for a color: that color's own photo if the admin set one, otherwise the product's main photo.
export const pickImage = (p, color) => p?.variants?.find((v) => v.color === color && v.image)?.image || p?.images?.[0] || ''

// Shows the real photo when there is one, and the drawn garment otherwise (or if the photo fails to load).
export default function ProductImage({ src, type, color, className = '', alt = '' }) {
  const [bad, setBad] = useState(false)
  useEffect(() => { setBad(false) }, [src])
  if (src && !bad) return <img className={`pimg ${className}`} src={imgSrc(src)} alt={alt} loading="lazy" decoding="async" onError={() => setBad(true)} />
  return <Garment type={type} color={color} className={className} />
}
