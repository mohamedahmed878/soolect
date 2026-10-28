import mongoose from 'mongoose'

// Product photos uploaded from the admin panel. Stored in MongoDB because serverless hosting has no disk.
// Products keep only the short URL (/api/images/<id>), never the bytes.
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp'] },
    size: { type: Number, required: true },
  },
  { timestamps: true }
)

export default mongoose.models.Image || mongoose.model('Image', imageSchema)
