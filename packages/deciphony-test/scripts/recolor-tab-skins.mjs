import fs from 'fs'
import path from 'path'

const dir = 'D:/data/deciphony/packages/deciphony-test/src/views/skins'
const def = JSON.parse(fs.readFileSync(path.join(dir, 'default.json'), 'utf8'))

function isColorOnly(content) {
  const t = String(content ?? '').trim()
  return t.length > 0 && !t.startsWith('<')
}

function themedRecolor(content, ink, strokeInk, lineCap = 'round') {
  let s = String(content)
    .replace(/stroke="black"/g, `stroke="${strokeInk}"`)
    .replace(/fill="black"/g, `fill="${ink}"`)
    .replace(/fill='black'/g, `fill="${ink}"`)
    .replace(/stroke='black'/g, `stroke="${strokeInk}"`)
    .replace(/fill="green"/gi, `fill="${ink}"`)
    .replace(/stroke="green"/gi, `stroke="${strokeInk}"`)
  if (lineCap === 'round' && !/stroke-linecap=/.test(s)) {
    s = s.replace(/<line /g, '<line stroke-linecap="round" ')
    s = s.replace(/<path /g, '<path stroke-linecap="round" ')
  }
  return `<g fill="${ink}" stroke="${strokeInk}">${s}</g>`
}

function mapTabPack(pack, ink, strokeInk) {
  const out = {}
  for (const [key, item] of Object.entries(pack)) {
    if (!item || typeof item !== 'object') continue
    const content = isColorOnly(item.content)
      ? ink
      : themedRecolor(item.content, ink, strokeInk)
    out[key] = {...item, content}
  }
  return out
}

function inkFromSkin(skin) {
  const slur = skin.standardStaff?.slur?.content?.trim()
  if (!slur) return {ink: '#000000', stroke: '#000000'}
  const m = slur.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) {
    const ink = `rgb(${m[1]},${m[2]},${m[3]})`
    return {ink, stroke: ink}
  }
  if (slur.startsWith('#') || slur.startsWith('rgb')) {
    return {ink: slur, stroke: slur}
  }
  return {ink: '#000000', stroke: '#000000'}
}

const targets = ['bambooForest', 'glacier', 'cosmos', 'dawn', 'moHua']
for (const name of targets) {
  const file = path.join(dir, `${name}.json`)
  const skin = JSON.parse(fs.readFileSync(file, 'utf8'))
  const {ink, stroke} = inkFromSkin(skin)
  const before = skin.tab6?.tab_note_0?.content
  skin.tab6 = mapTabPack(def.tab6, ink, stroke)
  skin.tab4 = mapTabPack(def.tab4, ink, stroke)
  fs.writeFileSync(file, JSON.stringify(skin, null, 2) + '\n', 'utf8')
  const after = skin.tab6.tab_note_0.content
  console.log(name, ink, 'changed', before !== after, 'keys', Object.keys(skin.tab6).length)
}

console.log('default untouched tab keys', Object.keys(def.tab6).length, Object.keys(def.tab4).length)
