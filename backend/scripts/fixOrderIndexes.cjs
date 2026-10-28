/**
 * Lists the indexes on the `orders` collection, and (with --drop) removes stale UNIQUE ones.
 *
 * Why: an old unique index (for example on contact.email) makes a second order fail with
 * "Already exists" now that checkout no longer asks for an email: every email-less order counts as "null".
 * The app only needs the unique index on `number`.
 *
 * Run from the project root (where .env lives):
 *   node backend/scripts/fixOrderIndexes.cjs          # just list the indexes
 *   node backend/scripts/fixOrderIndexes.cjs --drop   # drop unique indexes other than _id and number
 */
const path = require('path')
try { require('dotenv').config({ path: path.join(__dirname, '../../.env') }) } catch (e) { /* dotenv not installed */ }
const mongoose = require('mongoose')

const KEEP = new Set(['_id_', 'number_1'])

async function main() {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is missing. Check your .env file in the project root.'); process.exit(1) }
  await mongoose.connect(process.env.MONGODB_URI)
  const orders = mongoose.connection.db.collection('orders')
  const indexes = await orders.indexes()

  console.log('Indexes on orders:')
  for (const i of indexes) console.log(`  ${i.name}  keys=${JSON.stringify(i.key)}${i.unique ? '  UNIQUE' : ''}${i.sparse ? '  sparse' : ''}`)

  const stale = indexes.filter((i) => i.unique && !KEEP.has(i.name))
  if (!stale.length) { console.log('\nNo stale unique indexes found.'); return }

  console.log('\nStale unique indexes:', stale.map((i) => i.name).join(', '))
  if (!process.argv.includes('--drop')) { console.log('Run again with --drop to remove them.'); return }
  for (const i of stale) { await orders.dropIndex(i.name); console.log(`Dropped ${i.name}`) }
}

main().catch((e) => { console.error('Error:', e.message); process.exitCode = 1 }).finally(() => mongoose.disconnect())
