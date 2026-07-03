import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildNumberSkinContent, NUMBER_SKIN_H, NUMBER_SKIN_W } from './number-glyph-paths.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))
const jsonPath = path.join(root, '../src/skins/default.json')
const skinTsPath = path.join(root, '../src/skins/defaultSkin.ts')
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', 'X']

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
for (const d of digits) {
  const key = d === 'X' ? 'number_X' : `number_${d}`
  data.numberNotation[key] = {
    content: buildNumberSkinContent(d),
    w: NUMBER_SKIN_W,
    h: NUMBER_SKIN_H,
    skinKey: key,
  }
}
fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`)

let ts = fs.readFileSync(skinTsPath, 'utf8')
for (const d of digits) {
  const enumKey = d === 'X' ? 'Number_X' : `Number_${d}`
  const content = buildNumberSkinContent(d)
  const marker = `[NumberNotationSkinKeyEnum.${enumKey}]: {`
  const i = ts.indexOf(marker)
  if (i < 0) {
    console.warn('skip', enumKey)
    continue
  }
  const contentStart = ts.indexOf('content: `', i) + 'content: `'.length
  const contentEnd = ts.indexOf('`,', contentStart)
  ts = ts.slice(0, contentStart) + content + ts.slice(contentEnd)

  const blockStart = ts.indexOf(marker)
  const blockEnd = ts.indexOf('},', blockStart)
  let block = ts.slice(blockStart, blockEnd)
  block = block
    .replace(/w: [\d.]+,/, `w: ${NUMBER_SKIN_W},`)
    .replace(/h: [\d.]+,/, `h: ${NUMBER_SKIN_H},`)
  ts = ts.slice(0, blockStart) + block + ts.slice(blockEnd)
}
fs.writeFileSync(skinTsPath, ts)
console.log('synced number glyphs to default.json and defaultSkin.ts')
