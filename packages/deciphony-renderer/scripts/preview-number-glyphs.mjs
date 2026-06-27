import fs from 'fs'
import {NUMBER_GLYPH_PATHS, NUMBER_SKIN_W, NUMBER_SKIN_H} from './number-glyph-paths.mjs'

const order = ['X', '0', '1', '2', '3', '4', '5', '6', '7']
const gap = 8
const parts = []
order.forEach((d, i) => {
  const x = i * (NUMBER_SKIN_W + gap)
  parts.push(`<rect x="${x}" y="0" width="${NUMBER_SKIN_W}" height="${NUMBER_SKIN_H}" fill="none" stroke="#ddd"/>`)
  parts.push(`<g transform="translate(${x},0)">${NUMBER_GLYPH_PATHS[d]}</g>`)
})
const W = order.length * (NUMBER_SKIN_W + gap)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${NUMBER_SKIN_H}" viewBox="0 0 ${W} ${NUMBER_SKIN_H}"><rect width="100%" height="100%" fill="white"/>${parts.join('')}</svg>`
fs.writeFileSync(new URL('../number-preview.svg', import.meta.url), svg)
console.log('wrote number-preview.svg')
