/**
 * 给 JSON 皮肤补上倚音托架 grace_pedestal_before / grace_pedestal_after。
 * 优先从同 SkinPack 里已有的 tab6/tab4/tab5/numberNotation 拷贝；都没有则用内置 path，颜色取 breath 描边色。
 * 用法：node scripts/sync-grace-pedestal-skins.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const KEYS = ['grace_pedestal_before', 'grace_pedestal_after']
const PACKS = ['numberNotation', 'tab6', 'tab4', 'tab5']

const FALLBACK = {
  grace_pedestal_before: {
    content: '<path d="M 7 0 A 7 10 0 0 0 14 10" stroke="black" stroke-width="1" fill="none"/>',
    w: 14,
    h: 10,
    skinKey: 'grace_pedestal_before',
  },
  grace_pedestal_after: {
    content: '<path d="M 0 10 A 7 10 0 0 0 7 0" stroke="black" stroke-width="1" fill="none"/>',
    w: 14,
    h: 10,
    skinKey: 'grace_pedestal_after',
  },
}

function themeColor(pack) {
  const samples = [pack.breath, pack.grace_pedestal_before, pack.reduceLine_1, pack.number_1]
  for (const item of samples) {
    const c = item?.content?.match(/(?:stroke|fill)="(rgb\([^"]+\)|#[0-9a-fA-F]+|black)"/)?.[1]
    if (c) return c
  }
  return 'black'
}

function recolor(content, color) {
  if (color === 'black') return content
  return content
    .replace(/stroke="black"/g, `stroke="${color}"`)
    .replace(/fill="black"/g, `fill="${color}"`)
}

function sourceItems(pack) {
  for (const name of PACKS) {
    const table = pack[name]
    if (!table || KEYS.some((k) => !(k in table))) continue
    return Object.fromEntries(KEYS.map((k) => [k, structuredClone(table[k])]))
  }
  const color = themeColor(pack.numberNotation ?? pack.tab6 ?? pack.tab4 ?? pack.tab5 ?? {})
  return Object.fromEntries(
    KEYS.map((k) => {
      const base = structuredClone(FALLBACK[k])
      base.content = recolor(base.content, color)
      return [k, base]
    }),
  )
}

const testSkins = path.join(root, '../../deciphony-test/src/views/skins')
const files = [
  path.join(root, '../src/skins/default.json'),
  ...fs.readdirSync(testSkins).filter((f) => f.endsWith('.json')).map((f) => path.join(testSkins, f)),
]

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const isSkinPack = PACKS.some((p) => data[p] && typeof data[p] === 'object')
  const packs = isSkinPack ? [data] : Object.values(data).filter((p) => p && typeof p === 'object')
  let patched = 0
  for (const pack of packs) {
    const items = sourceItems(pack)
    for (const name of PACKS) {
      const table = pack[name]
      if (!table || typeof table !== 'object') continue
      let hit = false
      for (const key of KEYS) {
        if (key in table) continue
        table[key] = structuredClone(items[key])
        hit = true
      }
      if (hit) patched++
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`${path.relative(path.join(root, '../..'), file)}: +${patched} packs`)
}
