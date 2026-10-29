/**
 * 批量收紧 views/skins/*.json 简谱数字（number_*）布局高：
 * h 略小于字面高度，text 垂直居中（dominant-baseline=central）。
 *
 * 用法：node scripts/fix-number-glyph-height.mjs
 */
import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const skinsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/skins')

const FONT_SIZE = 24
/** Arial 齐线数字视觉高 ≈ 0.716em；布局盒略小于字面 */
const NEW_H = Math.round(FONT_SIZE * 0.716) - 2 // 15

function patchTextTag(tag) {
  let next = tag
  // y → 盒心
  if (/\by="[^"]*"/.test(next)) {
    next = next.replace(/\by="[^"]*"/, `y="${(NEW_H / 2).toFixed(2)}"`)
  } else {
    next = next.replace(/<text\b/, `<text y="${(NEW_H / 2).toFixed(2)}"`)
  }
  // dominant-baseline
  if (/\bdominant-baseline=/.test(next)) {
    next = next.replace(/\bdominant-baseline="[^"]*"/, 'dominant-baseline="central"')
  } else {
    next = next.replace(/<text\b/, '<text dominant-baseline="central"')
  }
  return next
}

function patchContent(content, w) {
  let next = content
  // 去掉为旧 35 高服务的 translate 包装，保留 defs + 内层节点
  next = next.replace(
    /<g\s+transform="translate\([^"]*\)">\s*([\s\S]*?)\s*<\/g>\s*$/i,
    '$1',
  )
  // 所有 text：居中
  next = next.replace(/<text\b[^>]*>[\s\S]*?<\/text>/gi, (tag) => {
    let t = patchTextTag(tag)
    // x 对齐盒宽中心（若仍是旧的 10）
    const half = (typeof w === 'number' && w > 0 ? w : 14.16) / 2
    t = t.replace(/\bx="10"/, `x="${half}"`)
    return t
  })
  return next
}

const skinFiles = fs.readdirSync(skinsDir).filter((f) => f.endsWith('.json'))

for (const file of skinFiles) {
  const p = path.join(skinsDir, file)
  const data = JSON.parse(fs.readFileSync(p, 'utf8'))
  const pack = data.numberNotation
  if (!pack) {
    console.log(`${file}: skip (no numberNotation)`)
    continue
  }

  let count = 0
  for (const key of Object.keys(pack)) {
    if (!key.startsWith('number_')) continue
    const item = pack[key]
    if (!item?.content) continue
    item.h = NEW_H
    item.content = patchContent(item.content, item.w)
    count++
  }

  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`${file}: ${count} number glyphs → h=${NEW_H}`)
}

// verify
for (const file of skinFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(skinsDir, file), 'utf8'))
  const sample = data.numberNotation?.number_1
  if (!sample) continue
  const okH = sample.h === NEW_H
  const okY = sample.content.includes(`y="${(NEW_H / 2).toFixed(2)}"`)
  const okDb = sample.content.includes('dominant-baseline="central"')
  console.log(`check ${file}: h=${okH} y=${okY} baseline=${okDb}`)
}
