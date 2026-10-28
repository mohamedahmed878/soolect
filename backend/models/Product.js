import mongoose from 'mongoose'

// One purchasable combination of color + size, with its own SKU, price, stock and image.
const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: [true, 'Every variant needs a SKU'], trim: true, uppercase: true, maxlength: 60 },
    color: { type: String, required: [true, 'Every variant needs a color'], trim: true, lowercase: true, maxlength: 30 },
    size: { type: String, required: [true, 'Every variant needs a size'], trim: true, maxlength: 20 },
    price: { type: Number, min: 0 }, // falls back to the product price when empty
    stock: { type: Number, min: [0, 'Stock cannot be negative'], default: 0, validate: { validator: Number.isInteger, message: 'Stock must be a whole number' } },
    image: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: { values: ['hoodies', 'tshirts', 'accessories'], message: 'Invalid category' } },
    type: { type: String, required: true, enum: { values: ['hoodie', 'tee', 'cap'], message: 'Invalid type' } },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: 0 }, // EGP
    oldPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviews: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    variants: {
      type: [variantSchema],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'Add at least one variant' },
    },
  },
  { timestamps: true }
)

productSchema.index({ 'variants.sku': 1 }, { unique: true })
productSchema.index({ category: 1, active: 1 })

productSchema.pre('validate', function (next) {
  const skus = new Set()
  const combos = new Set()
  for (const v of this.variants || []) {
    const combo = `${v.color}|${v.size}`
    if (skus.has(v.sku)) return next(new Error(`Duplicate SKU in this product: ${v.sku}`))
    if (combos.has(combo)) return next(new Error(`Duplicate variant: ${v.color} / ${v.size}`))
    skus.add(v.sku)
    combos.add(combo)
  }
  next()
})

productSchema.methods.variantPrice = function (variant) {
  return variant.price ?? this.price
}

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    const variants = ret.variants || []
    ret.colors = [...new Set(variants.map((v) => v.color))]
    ret.sizes = [...new Set(variants.map((v) => v.size))]
    ret.variants = variants.map((v) => ({ ...v, price: v.price ?? ret.price }))
    ret.inStock = variants.some((v) => v.stock > 0)
    delete ret.__v
    return ret
  },
})

export default mongoose.models.Product || mongoose.model('Product', productSchema)
