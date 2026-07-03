/** 简谱数字 path 皮肤：统一 20 宽 × 40 高画布，绘制区 x∈[4,16] y∈[6,34] */
export const NUMBER_GLYPH_TRANSFORM = 'translate(0, 0)'
export const NUMBER_SKIN_W = 20
export const NUMBER_SKIN_H = 40

const SW = 3
const STROKE = `fill="none" stroke="black" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"`

export const NUMBER_GLYPH_PATHS = {
  '0': `<ellipse cx="10" cy="20" rx="6" ry="14" fill="none" stroke="black" stroke-width="${SW}"/>`,
  '1': `<path d="M 6 11 L 10 6 V 34" ${STROKE}/>`,
  '2': `<path d="M 4 12 C 4 6 16 6 16 13 C 16 19 7 25 4 34 H 16" ${STROKE}/>`,
  '3': `<path d="M 4 12 C 4 6 16 5 16 12 C 16 17 11 20 7 20 C 11 20 16 22 16 28 C 16 35 4 35 4 28" ${STROKE}/>`,
  '4': `<path d="M 13 6 L 4 26 H 17 M 13 6 V 34" ${STROKE}/>`,
  '5': `<path d="M 15 6 H 6 V 18 H 11 C 16 18 16 34 6 33" ${STROKE}/>`,
  '6': `<path d="M 14 8 C 8 6 5 14 5 24 C 5 16 16 16 16 25 C 16 34 5 34 5 25" ${STROKE}/>`,
  '7': `<path d="M 4 6 H 16 L 8 34" ${STROKE}/>`,
  X: `<path d="M 5 8 L 15 32 M 15 8 L 5 32" ${STROKE}/>`,
}

export function buildNumberSkinContent(digit) {
  const body = NUMBER_GLYPH_PATHS[digit]
  if (!body) throw new Error(`unknown digit: ${digit}`)
  return `<g transform="${NUMBER_GLYPH_TRANSFORM}">\n        ${body}\n</g>`
}
