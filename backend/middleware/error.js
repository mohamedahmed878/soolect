import { HttpError } from '../utils/errors.js'

export function notFound(req, res) {
  res.status(404).json({ message: 'Not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' })
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Request too large' })
  if (err?.name === 'ValidationError') {
    const msg = Object.values(err.errors || {}).map((e) => e.message).join('. ')
    return res.status(400).json({ message: msg || 'Invalid data' })
  }
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid id or value' })
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || ''
    const message = field === 'email' ? 'Email already registered' : field.includes('sku') ? 'SKU already exists' : field === 'code' ? 'Code already exists' : field === 'number' ? 'Could not generate an order number, please try again' : 'Already exists'
    console.error('Duplicate key on', err.keyPattern, err.keyValue) // shows up in Vercel logs
    return res.status(409).json({ message: message === 'Already exists' && field ? `Already exists (${field})` : message })
  }
  console.error(err)
  res.status(500).json({ message: 'Server error' })
}
