import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))

const TAB6_MEASURE_LINES = [
  0.5, 11.5, 22.5, 33.5, 44.5, 55.5,
]
const TAB4_MEASURE_LINES = [0.5, 11.5, 22.5, 33.5]

function buildMeasureContent(lineYs) {
  const lines = lineYs
    .map((y) => `      <line x1="0" y1="${y}" x2="node.w" y2="${y}" stroke="black" stroke-width="1" />`)
    .join('\n')
  return `\n      <rect x="0" y="0" width="node.w" height="node.h" stroke="transparent" fill="transparent" />\n${lines}\n`
}

function scaleTabPackHeight(pack, fromH, toH) {
  for (const item of Object.values(pack)) {
    if (item && typeof item === 'object' && item.h === fromH) {
      item.h = toH
    }
    if (item && typeof item.content === 'string') {
      item.content = item.content.replaceAll(`y2="${fromH}"`, `y2="${toH}"`)
    }
  }
}

function fixRepeatBarlineContent(content, h) {
  const cy1 = Math.round((h / 2 - 7.5) * 10) / 10
  const cy2 = Math.round((h / 2 + 7.5) * 10) / 10
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

function fixRepeatBarlinesInPack(pack, h) {
  for (const key of ['startRepeat_barline', 'endRepeat_barline', 'start_end_repeat_barline']) {
    if (pack[key]?.content) {
      pack[key].content = fixRepeatBarlineContent(pack[key].content, h)
    }
  }
}

function patchJson(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  if (!data.tab6) {
    console.error(`tab6 section missing in ${jsonPath}`)
    return
  }

  // tab6 measure: h 55 -> 56（六线，末线在 55.5）
  data.tab6.measure.content = buildMeasureContent(TAB6_MEASURE_LINES)
  data.tab6.measure.h = 56
  scaleTabPackHeight(data.tab6, 55, 56)
  fixRepeatBarlinesInPack(data.tab6, 56)

  // tab4: 复制 tab6，measure 四线 h=34，小节线高度同步
  const tab4 = structuredClone(data.tab6)
  tab4.measure.content = buildMeasureContent(TAB4_MEASURE_LINES)
  tab4.measure.h = 34
  scaleTabPackHeight(tab4, 56, 34)
  fixRepeatBarlinesInPack(tab4, 34)
  data.tab4 = tab4

  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log(`patched ${jsonPath}`)
}

for (const rel of [
  '../src/skins/default.json',
  '../../deciphony-test/src/views/skins/default.json',
]) {
  patchJson(path.join(root, rel))
}
