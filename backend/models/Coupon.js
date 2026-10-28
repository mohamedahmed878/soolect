import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: [true, 'Code is required'], unique: true, uppercase: true, trim: true, maxlength: 40 },
    type: { type: String, enum: { values: ['percent', 'fixed'], message: 'Type must be percent or fixed' }, required: true },
    value: { type: Number, required: [true, 'Value is required'], min: [1, 'Value must be at least 1'] },
    maxDiscount: { type: Number, min: 0 }, // cap for percent coupons (EGP)
    minSubtotal: { type: Number, min: 0, default: 0 },
    expiresAt: Date,
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

couponSchema.pre('validate', function (next) {
  if (this.type === 'percent' && this.value > 100) return next(new Error('A percent coupon cannot exceed 100'))
  next()
})

couponSchema.set('toJSON', { transform: (doc, ret) => { delete ret.__v; return ret } })

export default mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)
