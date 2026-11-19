/**
 * Hand the viewer a text file to save (catch-up Phase 38: the GST report's
 * Download), built in the browser from content the caller has already worked
 * out: a Blob, an object URL and a clicked anchor. No request leaves the page.
 * The one place a screen saves a file, so a test can spy on it.
 */
export function downloadTextFile(fileName: string, text: string, mimeType = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
