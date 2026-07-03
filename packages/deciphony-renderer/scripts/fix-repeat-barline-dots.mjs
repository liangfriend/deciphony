import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))

/** 反复点小节线：两圆点间距 15，整体相对 measure 高度垂直居中 */
const REPEAT_BARLINE_KEYS = [
  'startRepeat_barline',
  'endRepeat_barline',
  'start_end_repeat_barline',
]

function repeatDotCy(h) {
  const cy1 = Math.round((h / 2 - 7.5) * 10) / 10
  const cy2 = Math.round((h / 2 + 7.5) * 10) / 10
  return { cy1, cy2 }
}

function fixRepeatBarlineContent(content, h) {
  const { cy1, cy2 } = repeatDotCy(h)
  const cyValues = [...content.matchAll(/cy="([\d.]+)"/g)].map((m) => parseFloat(m[1]))
  if (cyValues.length === 0) return content

  const unique = [...new Set(cyValues)].sort((a, b) => a - b)
  const oldLow = unique[0]
  const oldHigh = unique[unique.length - 1]
  if (oldLow === cy1 && oldHigh === cy2) return content

  let out = content
  out = out.replaceAll(`cy="${oldHigh}"`, `cy="${cy2}"`)
  out = out.replaceAll(`cy="${oldLow}"`, `cy="${cy1}"`)
  return out
}

function fixPack(pack) {
  if (!pack?.measure) return 0
  const h = pack.measure.h
  let n = 0
  for (const key of REPEAT_BARLINE_KEYS) {
    const item = pack[key]
    if (!item?.content) continue
    const next = fixRepeatBarlineContent(item.content, h)
    if (next !== item.content) {
      item.content = next
      n++
    }
  }
  return n
}

function fixJson(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  let total = 0
  for (const section of Object.values(data)) {
    if (section && typeof section === 'object' && section.measure) {
      total += fixPack(section)
    }
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log(`${jsonPath}: updated ${total} barline skins`)
}

for (const rel of [
  '../src/skins/default.json',
  '../../deciphony-test/src/views/skins/default.json',
]) {
  fixJson(path.join(root, rel))
}
