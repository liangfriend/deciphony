import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))
const enumPath = path.join(root, '../src/guitarTab/enums/guitarTabSkinKeyEnum.ts')
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

function tabNoteLabel(skinKey) {
  if (skinKey === 'tab_note_x') return 'x'
  return skinKey.replace('tab_note_', '')
}

function tabHarmonicLabel(skinKey) {
  const base = tabNoteLabel(skinKey.replace('tab_harmonic_', 'tab_note_'))
  return `<${base}>`
}

function makeTabNoteSkin(skinKey) {
  const label = tabNoteLabel(skinKey)
  const num = label === 'x' ? -1 : Number(label)
  const w = num >= 10 ? 10 : 5
  return {
    content: `<g transform="translate(0.0000, 9.0000)">\n        <text transform="scale(0.5)">${label}</text>\n</g>`,
    w,
    h: 11,
    skinKey,
    widthRatio: 10,
    widthRatioForMeasure: 10,
  }
}

function tabHarmonicTranslateX(skinKey) {
  const label = tabNoteLabel(skinKey.replace('tab_harmonic_', 'tab_note_'))
  return label.length >= 2 ? -5 : -1
}

function makeTabHarmonicSkin(skinKey) {
  const label = tabHarmonicLabel(skinKey)
  const inner = label.slice(1, -1)
  const num = inner === 'x' ? -1 : Number(inner)
  const w = num >= 10 ? 14 : 8
  const x = tabHarmonicTranslateX(skinKey)
  return {
    content: `<g transform="translate(${x.toFixed(4)}, 13.0000)">\n        <text transform="scale(0.7)">${label}</text>\n</g>`,
    w,
    h: 16,
    skinKey,
    widthRatio: 10,
    widthRatioForMeasure: 10,
  }
}

/** guitarTab 倚音减时线/托架：相对简谱永久缩小一半（坐标直接绘制，不用 transform scale） */
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

const GUITAR_TAB_HALF_GRACE_SKINS = {
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
  const half = GUITAR_TAB_HALF_GRACE_SKINS[key]
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
const oldPack = data.guitarTab ?? {}
const newPack = {}

let added = 0
let kept = 0
let removed = 0

for (const key of enumKeys) {
  if (key.startsWith('tab_note_')) {
    newPack[key] = makeTabNoteSkin(key)
    if (!oldPack[key]) added++
    else kept++
    continue
  }
  if (key.startsWith('tab_harmonic_')) {
    newPack[key] = makeTabHarmonicSkin(key)
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

data.guitarTab = newPack
fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`)

console.log(`guitarTab synced: kept ${kept}, tabNote ${added + 28} total, removed ${removed} unused keys`)
console.log(`enum keys: ${enumKeys.size}, pack keys: ${Object.keys(newPack).length}`)

const missing = [...enumKeys].filter((k) => !newPack[k])
if (missing.length) {
  console.warn('still missing:', missing.join(', '))
}
