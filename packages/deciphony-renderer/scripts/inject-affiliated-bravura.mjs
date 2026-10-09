/**
 * 把 bravuraGlyphsByKey 中的附属符号（奏法 / 装饰 / 呼吸 / 力度）写入各皮肤 JSON 的各谱种 pack。
 * 已有同名项则整项替换为 Bravura；主题色由后续 sync-bravura-skins 再上色。
 *
 * 用法：先 node scripts/extract-bravura-glyphs.mjs，再本脚本。
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// 直接读生成文件里的 bravuraGlyphsByKey（避免 TS path）
const genPath = path.join(ROOT, 'src/skins/generated/bravuraStandardStaff.ts')
const genSrc = fs.readFileSync(genPath, 'utf8')
const m = genSrc.match(/export const bravuraGlyphsByKey[^=]*=\s*(\{[\s\S]*?\n\})/)
if (!m) throw new Error('bravuraGlyphsByKey not found')
const bravuraGlyphsByKey = Function(`"use strict"; return (${m[1]})`)()

const AFFILIATED_KEYS = [
  'acccent_above', 'staccato_above', 'staccatissimo_above', 'tenuto_above', 'loure_above', 'marcato_above',
  'accent_staccato_above', 'marcato_staccato_above', 'marcato_tenuto_above',
  'staccatissimo_stroke_above', 'staccatissimo_wedge_above',
  'stress_above', 'tenuto_accent_above', 'unstress_above',
  'open', 'muted', 'harmonic', 'up_bow', 'down_bow', 'breath',
  'turn', 'invertedTurn', 'trill', 'shortTrill', 'mordent',
  'dyn_ppp', 'dyn_pp', 'dyn_p', 'dyn_mp', 'dyn_mf', 'dyn_f', 'dyn_ff', 'dyn_fff',
  'dyn_fp', 'dyn_pf', 'dyn_sf', 'dyn_sfz', 'dyn_sffz', 'dyn_sfp', 'dyn_rfz', 'dyn_rf', 'dyn_fz',
  'prelude_bracket_left', 'prelude_bracket_right',
]

const PACKS = ['standardStaff', 'numberNotation', 'tab6', 'tab4', 'tab5', 'drumNotation']

const targets = [
  path.join(ROOT, 'src/skins/default.json'),
  path.join(ROOT, '../deciphony-test/src/views/skins/default.json'),
  ...['bambooForest', 'cosmos', 'dawn', 'glacier', 'moHua'].map((n) =>
    path.join(ROOT, `../deciphony-test/src/views/skins/${n}.json`),
  ),
]

function itemOf(key) {
  const g = bravuraGlyphsByKey[key]
  if (!g) return null
  return {content: g.content, w: g.w, h: g.h, skinKey: key}
}

let missing = []
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.warn('skip missing', file)
    continue
  }
  const skin = JSON.parse(fs.readFileSync(file, 'utf8'))
  let n = 0
  for (const pack of PACKS) {
    if (!skin[pack]) continue
    for (const key of AFFILIATED_KEYS) {
      const item = itemOf(key)
      if (!item) {
        missing.push(key)
        continue
      }
      skin[pack][key] = structuredClone(item)
      n++
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(skin, null, 2)}\n`)
  console.log(path.basename(file), 'wrote', n, 'affiliated glyphs')
}
if (missing.length) {
  console.warn('missing bravura keys:', [...new Set(missing)].join(', '))
}
