/**
 * Photos are stored inline in IndexedDB as data URLs, so every kilobyte is
 * a kilobyte the app carries forever. Supplier photos arrive at full phone
 * resolution — a few hundred of those will bloat the database and slow the
 * catalog down. Everything gets downscaled and re-encoded on the way in.
 */

/** Longest edge, in px, kept for a stored product photo. */
export const MAX_EDGE = 900
/** JPEG quality — 0.72 is the point where product photos stop losing detail. */
export const QUALITY = 0.72

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })
}

function drawToDataUrl(img: HTMLImageElement, maxEdge: number, quality: number): string {
  const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1
  const scale = Math.min(1, maxEdge / longest)
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable')

  // JPEG has no alpha channel — without this, transparent PNGs go black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  return canvas.toDataURL('image/jpeg', quality)
}

/** Compress a picked/dropped file into a storable data URL. */
export async function compressImageFile(
  file: File,
  maxEdge: number = MAX_EDGE,
  quality: number = QUALITY,
): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return drawToDataUrl(img, maxEdge, quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Recompress an existing data URL, keeping the original if it was smaller. */
export async function compressDataUrl(
  dataUrl: string,
  maxEdge: number = MAX_EDGE,
  quality: number = QUALITY,
): Promise<string> {
  const img = await loadImage(dataUrl)
  const out = drawToDataUrl(img, maxEdge, quality)
  return out.length < dataUrl.length ? out : dataUrl
}

/** Approximate decoded byte size of a data URL, for size warnings. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return 0
  const b64 = dataUrl.slice(comma + 1)
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
