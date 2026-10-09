/**
 * 主题皮肤的方括号（square）按同谱种标准连谱号（bracket）的描边色上色，避免主题下仍是纯黑。
 * 用法：node packages/deciphony-test/scripts/theme-square-brackets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const skinsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/skins')
const THEMES = ['bambooForest', 'cosmos', 'dawn', 'glacier', 'moHua']

function bracketPaint(bracket) {
  const content = bracket?.content ?? ''
  const defs = content.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? ''
  const strokes = [...content.matchAll(/\bstroke="([^"]+)"/g)].map((m) => m[1])
  const stroke = strokes.find((s) => s !== 'none' && s !== 'transparent')
  return stroke ? {defs, stroke} : null
}

for (const theme of THEMES) {
  const file = path.join(skinsDir, `${theme}.json`)
  const skin = JSON.parse(fs.readFileSync(file, 'utf8'))
  const done = []
  for (const [packName, pack] of Object.entries(skin)) {
    const square = pack?.square
    const paint = bracketPaint(pack?.bracket)
    if (!square || !paint) continue
    const body = square.content.replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/\bstroke="[^"]*"/, `stroke="${paint.stroke}"`)
    square.content = paint.defs + body
    done.push(`${packName}:${paint.stroke}`)
  }
  fs.writeFileSync(file, `${JSON.stringify(skin, null, 2)}\n`)
  console.log(theme, done.join(' '))
}
