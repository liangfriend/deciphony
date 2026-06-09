/** 去掉外层 <svg>，保留 defs 与图形内容供皮肤 content 嵌入 */
export function stripSvgWrapper(svg: string): string {
    return svg
        .replace(/<\?xml[^>]*>/gi, '')
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>\s*$/i, '')
        .trim()
}

/** 将 defaultSkin 中的 black 替换为主题色，并统一线帽 */
export function themedRecolor(content: string, ink: string, strokeInk = ink, lineCap: 'round' | 'butt' = 'round'): string {
    let s = content
        .replace(/stroke="black"/g, `stroke="${strokeInk}"`)
        .replace(/fill="black"/g, `fill="${ink}"`)
        .replace(/fill='black'/g, `fill="${ink}"`)
        .replace(/stroke='black'/g, `stroke="${strokeInk}"`)
        .replace(/fill="green"/gi, `fill="${ink}"`)
        .replace(/stroke="green"/gi, `stroke="${strokeInk}"`)
    if (lineCap === 'round' && !/stroke-linecap=/.test(s)) {
        s = s.replace(/<line /g, '<line stroke-linecap="round" ')
        s = s.replace(/<path /g, '<path stroke-linecap="round" ')
    }
    return `<g fill="${ink}" stroke="${strokeInk}">${s}</g>`
}

export function wrapScaledInner(inner: string, scale: number, tx = 0, ty = 0): string {
    const parts = []
    if (tx !== 0 || ty !== 0) parts.push(`translate(${tx}, ${ty})`)
    if (scale !== 1) parts.push(`scale(${scale})`)
    const transform = parts.length ? ` transform="${parts.join(' ')}"` : ''
    return `<g${transform}>${inner}</g>`
}
