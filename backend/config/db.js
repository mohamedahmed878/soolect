import mongoose from 'mongoose'
import { env } from './env.js'

// Serverless functions are frozen and reused between requests, so the connection is cached on globalThis.
const cache = globalThis.__soolectMongo || (globalThis.__soolectMongo = { conn: null, promise: null })

export async function connectDB() {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn
  if (!cache.promise) {
    mongoose.set('strictQuery', true)
    cache.promise = mongoose
      .connect(env.mongoUri, { bufferCommands: false, serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .then((m) => m)
      .catch((e) => { cache.promise = null; throw e })
  }
  cache.conn = await cache.promise
  return cache.conn
}
