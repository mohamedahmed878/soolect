import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireUser } from '../middleware/auth.js'
import Review from '../models/Review.js'
import User from '../models/User.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { publicName, str } from '../utils/validate.js'

const router = Router()
const writeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many reviews. Try again later.' } })

export async function summary() {
  const rows = await Review.aggregate([{ $group: { _id: '$rating', n: { $sum: 1 } } }])
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let count = 0, sum = 0
  for (const r of rows) { breakdown[r._id] = r.n; count += r.n; sum += r._id * r.n }
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : 0, breakdown }
}

// Public: what the homepage shows.
router.get('/', asyncHandler(async (req, res) => {
  const [stats, list] = await Promise.all([summary(), Review.find().sort({ createdAt: -1 }).limit(12).lean()])
  res.json({
    ...stats,
    reviews: list.map((r) => ({ _id: r._id, name: publicName(r.name), rating: r.rating, comment: r.comment, createdAt: r.createdAt })),
  })
}))

// The logged-in customer's own review (to prefill the form).
router.get('/mine', requireUser, asyncHandler(async (req, res) => {
  const r = await Review.findOne({ userId: req.auth.id }).lean()
  res.json(r ? { _id: r._id, rating: r.rating, comment: r.comment } : null)
}))

// Logged-in customers only. Posting again replaces the earlier review.
router.post('/', writeLimiter, requireUser, asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5 stars')
  const comment = str(req.body.comment, 500)
  const user = await User.findById(req.auth.id)
  if (!user) throw new HttpError(401, 'Please log in')
  const review = await Review.findOneAndUpdate(
    { userId: user._id },
    { $set: { name: user.name, rating, comment } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  )
  res.status(201).json({ _id: review._id, rating: review.rating, comment: review.comment })
}))

router.delete('/mine', requireUser, asyncHandler(async (req, res) => {
  await Review.deleteOne({ userId: req.auth.id })
  res.json({ ok: true })
}))

export default router
