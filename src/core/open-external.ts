/** Open through the browser when an imperative external navigation is needed. */
export function openExternalUrl(url: string, target?: string): void {
  if (typeof window === 'undefined') return
  if (target && target !== '_self') window.open(url, target)
  else window.location.assign(url)
}
