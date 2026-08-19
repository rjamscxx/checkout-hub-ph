/**
 * Export the customer catalog board as JPEG / PDF, or share it via the native
 * share sheet. html-to-image and jspdf are dynamically imported so they only
 * load when the owner actually exports (keeps the initial bundle lean).
 */

// The customer catalog always renders on the light brand paper, so exports
// look the same regardless of the owner's app theme.
const PAPER = '#F7F6F3'

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Resolve once every <img> in the board has actually decoded. */
async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll('img'))
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return
    return new Promise<void>(res => {
      img.addEventListener('load', () => res(), { once: true })
      img.addEventListener('error', () => res(), { once: true })
    })
  }))
}

/**
 * Inlining the webfont refetches it from Google Fonts, so resolve it once per
 * session and reuse it across passes. Returns null when it can't be resolved
 * (offline) — the caller must then omit the option entirely so html-to-image
 * falls back to its own embedding rather than treating "" as "no fonts".
 */
let fontEmbedCache: string | null | undefined
async function fontEmbedCSS(node: HTMLElement): Promise<string | null> {
  if (fontEmbedCache !== undefined) return fontEmbedCache
  try {
    const { getFontEmbedCSS } = await import('html-to-image')
    const css = await getFontEmbedCSS(node)
    fontEmbedCache = css || null
  } catch {
    fontEmbedCache = null
  }
  return fontEmbedCache
}

async function captureOptions(node: HTMLElement) {
  const fonts = await fontEmbedCSS(node)
  return {
    pixelRatio: 2,
    backgroundColor: PAPER,
    width: node.offsetWidth,
    height: node.offsetHeight,
    ...(fonts ? { fontEmbedCSS: fonts } : {}),
    // The board is centred on screen with `margin: 0 auto`. getComputedStyle
    // resolves that to a real pixel margin, which html-to-image copies onto
    // its clone — shoving the content sideways so the right edge gets cropped
    // out of the canvas. Pin the clone flush to the origin.
    style: { margin: '0', transform: 'none' },
  }
}

async function nodeToJpeg(node: HTMLElement): Promise<string> {
  const { toJpeg } = await import('html-to-image')
  await waitForImages(node)
  const opts = { ...(await captureOptions(node)), quality: 0.95 }
  // The first pass primes html-to-image's resource cache; resources still
  // resolving during it render blank, so the second pass is the keeper.
  await toJpeg(node, opts)
  return toJpeg(node, opts)
}

export async function downloadJpeg(node: HTMLElement, filename: string): Promise<void> {
  triggerDownload(await nodeToJpeg(node), filename)
}

export async function downloadPdf(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await nodeToJpeg(node)
  const img = new Image()
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('image load failed')); img.src = dataUrl })
  const { jsPDF } = await import('jspdf')
  const w = img.width, h = img.height
  const pdf = new jsPDF({ orientation: h >= w ? 'portrait' : 'landscape', unit: 'px', format: [w, h], compress: true })
  // JPEG keeps a photo-heavy flyer to a size that actually sends over chat.
  pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h)
  pdf.save(filename)
}

/**
 * Share the catalog as an image file via the Web Share API (opens Messenger,
 * etc. on mobile). Returns 'shared', 'downloaded' (fallback), or 'cancelled'.
 */
export async function shareCatalog(node: HTMLElement, filename: string, storeName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const dataUrl = await nodeToJpeg(node)
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], filename, { type: 'image/jpeg' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `${storeName} — Catalog`, text: `Today's items from ${storeName}` })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
      // fall through to download on share failure
    }
  }
  triggerDownload(dataUrl, filename)
  return 'downloaded'
}
