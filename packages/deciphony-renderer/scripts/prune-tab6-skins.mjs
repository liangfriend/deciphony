import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const jsonPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/skins/default.json',
)

const REMOVE_KEYS = new Set([
  // clef
  'treble', 'bass', 'alto', 'Tenor', 'treble_f', 'bass_f', 'alto_f', 'tenor_f',
  // accidental
  'sharp', 'flat', 'double_sharp', 'double_flat', 'natural',
  // key signature
  'C', 'C_sharp', 'D_flat', 'D', 'E_flat', 'E', 'F', 'F_sharp', 'G_flat', 'G',
  'A_flat', 'A', 'B_flat', 'B', 'C_flat',
])

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const pack = data.tab6
if (!pack) {
  console.error('tab6 section not found')
  process.exit(1)
}

let removed = 0
for (const key of [...REMOVE_KEYS]) {
  if (key in pack) {
    delete pack[key]
    removed++
  }
}

fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`)
console.log(`removed ${removed} tab6 skin keys`)
