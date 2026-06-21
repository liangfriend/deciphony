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
  if (skinKey === 'tabNote_x') return 'x'
  return skinKey.replace('tabNote_', '')
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

const enumKeys = parseEnumSkinKeys()
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const oldPack = data.guitarTab ?? {}
const newPack = {}

let added = 0
let kept = 0
let removed = 0

for (const key of enumKeys) {
  if (key.startsWith('tabNote_')) {
    newPack[key] = makeTabNoteSkin(key)
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
