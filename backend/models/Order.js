import mongoose from 'mongoose'

export const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled']
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of what the customer bought, so later product edits never change old orders.
    name: String,
    type: String,
    sku: String,
    color: String,
    size: String,
    image: String,
    qty: { type: Number, min: 1, required: true },
    price: { type: Number, min: 0, required: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // empty for guest orders
    // Secret that lets a guest open /orders/:id without an account. Never returned in lists.
    accessToken: { type: String, required: true, select: false },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    contact: { email: { type: String, required: true }, phone: { type: String, required: true } },
    address: { fullName: String, address: String, city: String },
    shippingMethod: { type: String, enum: ['standard', 'express', 'free'], required: true },
    paymentMethod: { type: String, enum: ['card', 'vodafone', 'cod', 'paypal'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    discountCode: String,
    // Affiliate (marketer) attribution. The rate and amount are snapshots taken at checkout,
    // so changing a marketer's rate later never rewrites old orders. Hidden from customers (see toJSON).
    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', index: true },
    affiliateCode: String,
    commissionRate: Number,
    commission: { type: Number, default: 0, min: 0 },
    commissionPaid: { type: Boolean, default: false },
    commissionPaidAt: Date,
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'processing', index: true },
    timeline: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
)

orderSchema.index({ createdAt: -1 })

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.accessToken
    for (const k of ['affiliateId', 'affiliateCode', 'commissionRate', 'commission', 'commissionPaid', 'commissionPaidAt']) delete ret[k]
    delete ret.__v
    return ret
  },
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
