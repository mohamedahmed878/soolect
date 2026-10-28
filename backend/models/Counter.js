import mongoose from 'mongoose'

// Atomic counters (used for order numbers: SO10001, SO10002, ...).
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } })

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema)
