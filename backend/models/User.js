import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 30 },
  fullName: { type: String, trim: true, maxlength: 80, required: true },
  phone: { type: String, trim: true, maxlength: 30 },
  address: { type: String, trim: true, maxlength: 200, required: true },
  city: { type: String, trim: true, maxlength: 60, required: true },
  postal: { type: String, trim: true, maxlength: 20 },
  isDefault: { type: Boolean, default: false },
})

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, maxlength: 120 },
    phone: { type: String, required: [true, 'Phone is required'], trim: true, maxlength: 30 },
    passwordHash: { type: String, required: true, select: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    addresses: [addressSchema],
  },
  { timestamps: true }
)

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash
    delete ret.wishlist
    delete ret.addresses
    delete ret.__v
    return ret
  },
})

export default mongoose.models.User || mongoose.model('User', userSchema)
