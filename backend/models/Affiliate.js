import mongoose from 'mongoose'

// A marketer. Customers who arrive through `/?ref=CODE` and order are credited to them.
const affiliateSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    code: {
      type: String, required: [true, 'Code is required'], unique: true, uppercase: true, trim: true,
      match: [/^[A-Z0-9_-]{3,20}$/, 'Code must be 3-20 letters, numbers, - or _'],
    },
    email: { type: String, lowercase: true, trim: true, maxlength: 120 }, // also used to block self-referral
    phone: { type: String, trim: true, maxlength: 30 },
    commissionRate: {
      type: Number, required: [true, 'Commission rate is required'],
      min: [0, 'Commission rate cannot be negative'], max: [100, 'Commission rate cannot exceed 100'],
    },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
)

affiliateSchema.set('toJSON', { transform: (doc, ret) => { delete ret.__v; return ret } })

export default mongoose.models.Affiliate || mongoose.model('Affiliate', affiliateSchema)
