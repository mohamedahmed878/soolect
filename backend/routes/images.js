import { Router } from 'express'
import Image from '../models/Image.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { isObjectId } from '../utils/validate.js'

const router = Router()

// Public: the store and the admin panel show product photos from here.
router.get('/:id', asyncHandler(async (req, res) => {
  const img = isObjectId(req.params.id) ? await Image.findById(req.params.id) : null
  if (!img) throw new HttpError(404, 'Image not found')
  res.set({
    'Content-Type': img.contentType,
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    // A photo never changes once uploaded, so browsers and the CDN can keep it forever.
    'Cache-Control': 'public, max-age=31536000, immutable',
    // helmet blocks cross-origin embedding by default; the admin site lives on another domain and must show these.
    'Cross-Origin-Resource-Policy': 'cross-origin',
  })
  res.send(img.data)
}))

export default router
