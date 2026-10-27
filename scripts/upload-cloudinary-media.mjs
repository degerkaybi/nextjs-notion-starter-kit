import { readFile, writeFile, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'

const root = process.cwd()
const mapPath = path.join(root, 'data', 'media-urls.json')
const snapshot = JSON.parse(await readFile(path.join(root, 'data', 'portfolio-content.json'), 'utf8'))
const urls = JSON.parse(await readFile(mapPath, 'utf8'))
const localPaths = [...new Set(Object.values(snapshot.media).map(item => item.localPath).filter(Boolean))].sort()
const files = await Promise.all(localPaths.map(async localPath => {
  const filePath = path.join(root, 'public', localPath.slice(1))
  const extension = path.extname(filePath).toLowerCase()
  const resourceType = ['.mp4', '.webm', '.mov', '.m4v'].includes(extension) ? 'video' : 'image'
  return { localPath, filePath, resourceType, bytes: (await stat(filePath)).size }
}))

const missing = files.filter(file => !urls[file.localPath])
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
console.log(`${files.length} files, ${(totalBytes / 1048576).toFixed(1)} MiB; ${missing.length} to upload`)
if (process.argv.includes('--dry-run')) process.exit(0)

if (!process.env.CLOUDINARY_URL) {
  try { process.loadEnvFile(path.join(root, '.env.local')) } catch {}
}
if (!process.env.CLOUDINARY_URL) {
  throw new Error('CLOUDINARY_URL is missing. Put it in the ignored .env.local file, then run this script again.')
}
cloudinary.config({ secure: true })
const cloudName = cloudinary.config().cloud_name
if (!cloudName) throw new Error('Cloudinary cloud name could not be read from CLOUDINARY_URL')

let writeQueue = Promise.resolve()
function saveProgress() {
  writeQueue = writeQueue.then(async () => {
    const temporary = `${mapPath}.tmp`
    await writeFile(temporary, `${JSON.stringify(urls, null, 2)}\n`)
    await rename(temporary, mapPath)
  })
  return writeQueue
}

let cursor = 0
let complete = 0
const errors = []
async function worker() {
  while (cursor < missing.length) {
    const file = missing[cursor++]
    const publicId = `kaybid-portfolio/media/${path.basename(file.localPath, path.extname(file.localPath))}`
    try {
      let result
      try {
        result = await cloudinary.uploader.upload(file.filePath, {
          public_id: publicId,
          resource_type: file.resourceType,
          overwrite: false,
          unique_filename: false,
        })
      } catch (error) {
        if (!/already exists/i.test(String(error))) throw error
        result = await cloudinary.api.resource(publicId, { resource_type: file.resourceType })
      }
      if (!result.secure_url?.startsWith('https://')) throw new Error('Cloudinary did not return a secure URL')
      urls[file.localPath] = result.secure_url
      await saveProgress()
    } catch (error) {
      errors.push({ path: file.localPath, error: String(error) })
      console.error(`${file.localPath}: ${error}`)
    }
    complete++
    if (complete % 25 === 0 || complete === missing.length) console.log(`${complete}/${missing.length}`)
  }
}
await Promise.all(Array.from({ length: 3 }, () => worker()))
await writeQueue
if (errors.length) throw new Error(`${errors.length} uploads failed; rerun the script to retry them`)
console.log(`All media uploaded to Cloudinary cloud ${cloudName}. Commit data/media-urls.json before deployment.`)
