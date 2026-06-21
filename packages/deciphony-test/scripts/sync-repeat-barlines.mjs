import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const skinsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/skins')

const KEYS = ['startRepeat_barline', 'reverse_barline']

const TRANSFORMS = {
  startRepeat_barline: 'translate(-6.0000, 0.0000)',
  reverse_barline: 'translate(-4.0000, 0.0000)',
}

function extractElements(content) {
  const defs = content.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? ''
  let inner = content.replace(/<defs>[\s\S]*?<\/defs>/, '').trim()
  const gMatch = inner.match(/^<g\s+transform="[^"]*">([\s\S]*)<\/g>$/i)
  if (gMatch) inner = gMatch[1].trim()
  const elements = [...inner.matchAll(/<(line|circle)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/gi)].map((m) => m[0].trim())
  return { defs, elements }
}

function wrapContent(defs, elements, transform) {
  if (elements.length === 0) return null
  const body = elements.map((el, i) => (i === 0 ? `        ${el}` : `          ${el}`)).join('\n')
  const wrapped = `<g transform="${transform}">\n${body}\n</g>`
  return defs ? `${defs}\n${wrapped}` : wrapped
}

const defaultSkin = JSON.parse(fs.readFileSync(path.join(skinsDir, 'default.json'), 'utf8'))
const skinFiles = fs.readdirSync(skinsDir).filter((f) => f.endsWith('.json') && f !== 'default.json')

for (const file of skinFiles) {
  const p = path.join(skinsDir, file)
  const data = JSON.parse(fs.readFileSync(p, 'utf8'))
  let count = 0

  for (const section of ['standardStaff']) {
    for (const key of KEYS) {
      const item = data[section]?.[key]
      const ref = defaultSkin[section]?.[key]
      if (!item?.content || !ref) continue

      const { defs, elements } = extractElements(item.content)
      const next = wrapContent(defs, elements, TRANSFORMS[key])
      if (!next || next === item.content) continue

      item.content = next
      item.w = ref.w
      count++
    }
  }

  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`${file}: ${count} updated`)
}

// verify
for (const file of ['glacier.json', 'dawn.json', 'moHua.json']) {
  const data = JSON.parse(fs.readFileSync(path.join(skinsDir, file), 'utf8'))
  for (const key of KEYS) {
    const c = data.standardStaff[key].content
    const hasG = c.includes('<g transform="translate(-')
    console.log(`${file} ${key}: g=${hasG}`)
  }
}
