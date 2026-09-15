export function svgToDataUrl(raw: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`
}
