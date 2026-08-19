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
    // Pages are authored at their true output size (1920x1080), so capture 1:1.
    pixelRatio: 1,
    backgroundColor: PAPER,
    width: node.offsetWidth,
    height: node.offsetHeight,
    ...(fonts ? { fontEmbedCSS: fonts } : {}),
    // On screen the page is scaled down to fit the viewport, and its wrapper is
    // centred. getComputedStyle resolves both to concrete values that
    // html-to-image copies onto its clone — which would shrink the render and
    // shove it sideways out of the canvas. Pin the clone to 1:1 at the origin.
    style: { margin: '0', transform: 'none' },
  }
}

/** Never let a wedged capture leave the toolbar spinning forever. */
function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000}s`)), ms)),
  ])
}

async function nodeToJpeg(node: HTMLElement): Promise<string> {
  const { toJpeg } = await import('html-to-image')
  await withTimeout(waitForImages(node), 15000, 'Loading images')
  const opts = { ...(await captureOptions(node)), quality: 0.95 }
  // The first pass primes html-to-image's resource cache; resources still
  // resolving during it render blank, so the second pass is the keeper.
  await withTimeout(toJpeg(node, opts), 60000, 'Rendering (pass 1)')
  return withTimeout(toJpeg(node, opts), 60000, 'Rendering (pass 2)')
}

/** `catalog.jpg` for a single page, `catalog-1of3.jpg`… for a set. */
function pageName(base: string, i: number, total: number, ext: string) {
  return total > 1 ? `${base}-${i + 1}of${total}.${ext}` : `${base}.${ext}`
}

/** One JPEG per page, so every product stays legible at full size. */
export async function downloadJpegPages(nodes: HTMLElement[], base: string): Promise<void> {
  for (let i = 0; i < nodes.length; i++) {
    triggerDownload(await nodeToJpeg(nodes[i]), pageName(base, i, nodes.length, 'jpg'))
    // Chrome silently drops downloads fired back to back; let each one land.
    if (i < nodes.length - 1) await new Promise(res => setTimeout(res, 500))
  }
}

/** All pages in one landscape PDF. */
export async function downloadPdfPages(nodes: HTMLElement[], filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const w = nodes[0].offsetWidth, h = nodes[0].offsetHeight
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [w, h], compress: true })
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0) pdf.addPage([w, h], 'landscape')
    // JPEG keeps a photo-heavy flyer to a size that actually sends over chat.
    pdf.addImage(await nodeToJpeg(nodes[i]), 'JPEG', 0, 0, w, h)
  }
  pdf.save(filename)
}

/**
 * Share every page via the Web Share API (opens Messenger, etc. on mobile).
 * Returns 'shared', 'downloaded' (fallback), or 'cancelled'.
 */
export async function shareCatalogPages(nodes: HTMLElement[], base: string, storeName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const urls: string[] = []
  for (const node of nodes) urls.push(await nodeToJpeg(node))

  const files = await Promise.all(urls.map(async (url, i) =>
    new File([await (await fetch(url)).blob()], pageName(base, i, urls.length, 'jpg'), { type: 'image/jpeg' })
  ))

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare && nav.canShare({ files })) {
    try {
      await nav.share({ files, title: `${storeName} — Catalog`, text: `Today's items from ${storeName}` })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
      // fall through to download on share failure
    }
  }
  for (let i = 0; i < urls.length; i++) {
    triggerDownload(urls[i], pageName(base, i, urls.length, 'jpg'))
    if (i < urls.length - 1) await new Promise(res => setTimeout(res, 500))
  }
  return 'downloaded'
}
