import { BASE } from './api'

// Product photos are stored as /api/images/<id> (relative to the store). The admin lives on another domain, so prefix it.
export const imgSrc = (u) => (!u ? '' : /^(https?:|data:|blob:)/i.test(u) ? u : `${BASE}${u}`)

const OK = /^image\/(png|jpe?g|webp)$/i

// Phone photos are 3-12 MB. Shrink to at most `max` px on the long side and re-encode as JPEG (about 150-400 KB)
// so the upload is quick on mobile data and stays under the server's size limit. PNG transparency becomes white.
export async function compressImage(file, max = 1400, quality = 0.82) {
  if (!OK.test(file.type)) throw new Error(`${file.name || 'This file'} is not a PNG or JPG image`)

  let source, w, h
  try {
    source = await createImageBitmap(file) // applies the photo's rotation (EXIF) in current browsers
    w = source.width; h = source.height
  } catch {
    source = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not read ${file.name || 'the image'}`)) }
      img.src = url
    })
    w = source.naturalWidth; h = source.naturalHeight
  }

  const scale = Math.min(1, max / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('Could not process the image')
  return blob
}
