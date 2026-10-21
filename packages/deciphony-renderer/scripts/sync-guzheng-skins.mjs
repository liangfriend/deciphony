/**
 * 把 src/skins/guzhengGlyphs.ts 的古筝指法符号写进 JSON 皮肤（renderer 默认 + test 演示皮肤）的每个谱种包。
 * 颜色沿用该包 breath 项的颜色（缺省 black）。
 * 用法：node scripts/sync-guzheng-skins.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const glyphSrc = fs.readFileSync(path.join(root, '../src/skins/guzhengGlyphs.ts'), 'utf8')
const literal = glyphSrc.match(/GUZHENG_GLYPHS: Record<string, GuzhengGlyph> = (\{[\s\S]*?\n\});/)
if (!literal) throw new Error('GUZHENG_GLYPHS not found')
const glyphs = JSON.parse(literal[1])
const strokeWidth = Number(glyphSrc.match(/GUZHENG_STROKE_WIDTH = ([\d.]+)/)[1])

const content = (g, color) =>
  `<rect x="0" y="0" width="${g.w}" height="${g.h}" fill="transparent" stroke="none"/>`
  + `<path d="${g.d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`

const testSkins = path.join(root, '../../deciphony-test/src/views/skins')
const files = [
  path.join(root, '../src/skins/default.json'),
  ...fs.readdirSync(testSkins).filter((f) => f.endsWith('.json')).map((f) => path.join(testSkins, f)),
]

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  let packs = 0
  for (const pack of Object.values(data)) {
    if (!pack || typeof pack !== 'object' || !pack.breath) continue
    const color = pack.breath.content.match(/(?:fill|stroke)="([^"]+)"/)?.[1] ?? 'black'
    for (const [key, g] of Object.entries(glyphs)) {
      pack[key] = {content: content(g, color), w: g.w, h: g.h, skinKey: key}
    }
    packs++
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`${path.relative(path.join(root, '../..'), file)}: ${packs} packs`)
}
