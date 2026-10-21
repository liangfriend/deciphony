import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))
const enumPath = path.join(root, '../src/tab6/enums/tab6SkinKeyEnum.ts')
const jsonPath = path.join(root, '../src/skins/default.json')

/** 从枚举文件提取 skinKey 字符串（去重） */
function parseEnumSkinKeys() {
  const text = fs.readFileSync(enumPath, 'utf8')
  const keys = new Set()
  for (const m of text.matchAll(/=\s*'([^']+)'/g)) {
    keys.add(m[1])
  }
  return keys
}

/**
 * tab_note / tab_harmonic 已改为 path 字形：数字与 X 为 Roboto Condensed Bold 实心轮廓
 * （SIL Open Font License 1.1；单字格 100×200，scale(0.048)，基线 y=184、数字高 168，见 default.json）。
 * 同步时保留现有 content/w/h，不再用 text + translate(2,12) 等基线补偿覆盖。
 */
function keepOrStubTabGlyph(skinKey, oldItem) {
  if (oldItem?.content && !String(oldItem.content).includes('<text')) {
    return {...oldItem, skinKey}
  }
  console.warn(`missing path glyph for ${skinKey}; keep stub, do not invent text offset`)
  return {
    content: oldItem?.content ?? '<g/>',
    w: oldItem?.w ?? 8,
    h: oldItem?.h ?? 16,
    skinKey,
    widthRatio: oldItem?.widthRatio ?? 10,
    widthRatioForMeasure: oldItem?.widthRatioForMeasure ?? 10,
  }
}

/** tab6 倚音减时线/托架：相对简谱永久缩小一半（坐标直接绘制，不用 transform scale） */
const GRACE_REDUCE_LINE_Y = [0.25, 2.25, 3.75, 4.75, 5.75, 6.75]
const GRACE_REDUCE_LINE_H = [5, 7.5, 9, 10, 11, 12]

function makeGraceReduceLineSkin(lineCount) {
  const lines = GRACE_REDUCE_LINE_Y.slice(0, lineCount)
    .map((y) => `<line x1="0" y1="${y}" x2="node.w" y2="${y}" stroke="black" stroke-width="1"/>`)
    .join('\n')
  return {
    content: lines,
    w: 0,
    h: GRACE_REDUCE_LINE_H[lineCount - 1],
  }
}

const TAB_6_HALF_GRACE_SKINS = {
  reduceLine_1: makeGraceReduceLineSkin(1),
  reduceLine_2: makeGraceReduceLineSkin(2),
  reduceLine_3: makeGraceReduceLineSkin(3),
  reduceLine_4: makeGraceReduceLineSkin(4),
  reduceLine_5: makeGraceReduceLineSkin(5),
  reduceLine_6: makeGraceReduceLineSkin(6),
  grace_pedestal_before: {
    content: '<path d="M 3.5 0 A 3.5 5 0 0 0 7 5" stroke="black" stroke-width="1" fill="none"/>',
    w: 7,
    h: 5,
  },
  grace_pedestal_after: {
    content: '<path d="M 0 5 A 3.5 5 0 0 0 3.5 0" stroke="black" stroke-width="1" fill="none"/>',
    w: 7,
    h: 5,
  },
}

function buildHalvedGraceSkin(key) {
  const half = TAB_6_HALF_GRACE_SKINS[key]
  if (!half) return null
  return {
    ...half,
    skinKey: key,
  }
}

const GRACE_REDUCE_LINE_KEYS = new Set([
  'reduceLine_1',
  'reduceLine_2',
  'reduceLine_3',
  'reduceLine_4',
  'reduceLine_5',
  'reduceLine_6',
  'grace_pedestal_before',
  'grace_pedestal_after',
])

const enumKeys = parseEnumSkinKeys()
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const oldPack = data.tab6 ?? {}
const newPack = {}

let added = 0
let kept = 0
let removed = 0

for (const key of enumKeys) {
  if (key.startsWith('tab_note_') || key.startsWith('tab_harmonic_')) {
    newPack[key] = keepOrStubTabGlyph(key, oldPack[key])
    if (!oldPack[key]) added++
    else kept++
    continue
  }
  if (GRACE_REDUCE_LINE_KEYS.has(key)) {
    const halfSkin = buildHalvedGraceSkin(key)
    if (!halfSkin) {
      console.warn(`missing half grace skin: ${key}`)
      continue
    }
    newPack[key] = halfSkin
    if (!oldPack[key]) added++
    else kept++
    continue
  }
  if (oldPack[key]) {
    newPack[key] = oldPack[key]
    kept++
  }
}

for (const key of Object.keys(oldPack)) {
  if (!enumKeys.has(key)) removed++
}

data.tab6 = newPack
if (data.tab4) {
  for (const key of Object.keys(newPack)) {
    if (key.startsWith('tab_note_') || key.startsWith('tab_harmonic_')) {
      data.tab4[key] = {...newPack[key]}
    }
  }
}
fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`)

console.log(`tab6 synced: kept ${kept}, tabNote ${added + 28} total, removed ${removed} unused keys`)
console.log(`enum keys: ${enumKeys.size}, pack keys: ${Object.keys(newPack).length}`)

const missing = [...enumKeys].filter((k) => !newPack[k])
if (missing.length) {
  console.warn('still missing:', missing.join(', '))
}
