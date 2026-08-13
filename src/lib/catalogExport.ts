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

async function nodeToJpeg(node: HTMLElement): Promise<string> {
  const { toJpeg } = await import('html-to-image')
  return toJpeg(node, { quality: 0.95, pixelRatio: 2, backgroundColor: PAPER, cacheBust: true })
}

async function nodeToPng(node: HTMLElement): Promise<string> {
  const { toPng } = await import('html-to-image')
  return toPng(node, { pixelRatio: 2, backgroundColor: PAPER, cacheBust: true })
}

export async function downloadJpeg(node: HTMLElement, filename: string): Promise<void> {
  triggerDownload(await nodeToJpeg(node), filename)
}

export async function downloadPdf(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await nodeToPng(node)
  const img = new Image()
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('image load failed')); img.src = dataUrl })
  const { jsPDF } = await import('jspdf')
  const w = img.width, h = img.height
  const pdf = new jsPDF({ orientation: h >= w ? 'portrait' : 'landscape', unit: 'px', format: [w, h] })
  pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
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
