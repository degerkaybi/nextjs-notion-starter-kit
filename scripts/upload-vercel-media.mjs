import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { list, put } from '@vercel/blob'

const root = process.cwd()
const dryRun = process.argv.includes('--dry-run')
const snapshot = JSON.parse(await readFile(path.join(root, 'data', 'portfolio-content.json'), 'utf8'))
const paths = [...new Set(Object.values(snapshot.media).map(item => item.localPath).filter(Boolean))].sort()
let totalBytes = 0
for (const pathname of paths) {
  const bytes = await readFile(path.join(root, 'public', pathname.slice(1)))
  totalBytes += bytes.length
}
console.log(`${paths.length} files, ${(totalBytes / 1048576).toFixed(1)} MiB`)
if (dryRun) process.exit(0)

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  try { process.loadEnvFile(path.join(root, '.env.local')) } catch {}
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN is missing. Connect a public Vercel Blob store and pull its environment variables into .env.local.')
}

const existing = new Map()
let cursor
do {
  const result = await list({ prefix: 'media/', limit: 1000, cursor })
  for (const blob of result.blobs) existing.set(blob.pathname, blob.url)
  cursor = result.hasMore ? result.cursor : undefined
} while (cursor)

let next = 0
let done = 0
const urls = []
async function worker() {
  while (next < paths.length) {
    const pathname = paths[next++].slice(1)
    if (existing.has(pathname)) {
      urls.push(existing.get(pathname))
    } else {
      const body = await readFile(path.join(root, 'public', pathname))
      const result = await put(pathname, body, { access: 'public', addRandomSuffix: false, multipart: body.length > 20 * 1024 * 1024 })
      urls.push(result.url)
    }
    done++
    if (done % 25 === 0 || done === paths.length) console.log(`${done}/${paths.length}`)
  }
}
await Promise.all(Array.from({ length: 4 }, () => worker()))

const origins = [...new Set(urls.map(url => new URL(url).origin))]
if (origins.length !== 1) throw new Error(`Expected one Blob origin, got ${origins.length}`)
await writeFile(path.join(root, 'data', 'media-origin.json'), `${JSON.stringify({ baseUrl: origins[0] }, null, 2)}\n`)
console.log(`Uploaded and configured ${origins[0]}`)
