import mongoose from 'mongoose'

// One review per customer: posting again edits the earlier one.
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
)

reviewSchema.index({ createdAt: -1 })

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
