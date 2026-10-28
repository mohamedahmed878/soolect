// Local development only. On Vercel the app is served by api/index.js.
import app from './app.js'
import { connectDB } from './config/db.js'

const port = Number(process.env.PORT) || 4000

connectDB()
  .then(() => app.listen(port, () => console.log(`API listening on http://localhost:${port}`)))
  .catch((e) => { console.error('Failed to start:', e.message); process.exit(1) })
