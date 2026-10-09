/**
 * 把 renderer defaultSkin 中来自 Bravura 的符号同步到 src/views/skins/*.json。
 * - default.json：整项替换为 defaultSkin 对应项
 * - 主题皮肤：保留该项原有 <defs> 渐变与 fill/stroke 上色，只把形状换成 Bravura，尺寸对齐 defaultSkin
 *
 * 用法（在 renderer 目录下借用其 tsx 与 tsconfig paths）：
 *   cd packages/deciphony-renderer && npx tsx ../deciphony-test/scripts/sync-bravura-skins.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defaultSkin} from '../../deciphony-renderer/src/skins/defaultSkin'
import {
  bravuraGlyphsByKey,
  bravuraNumberNotationGlyphs,
  bravuraStaffTimeSignatures,
} from '../../deciphony-renderer/src/skins/generated/bravuraStandardStaff'

type Item = {content: string; w: number; h: number; skinKey: string; [k: string]: unknown}
type Pack = Record<string, Item>
type SkinJson = Record<string, Pack>

const PACKS = ['standardStaff', 'numberNotation', 'tab6', 'tab4', 'tab5', 'drumNotation'] as const
const THEMES = ['bambooForest', 'cosmos', 'dawn', 'glacier', 'moHua']
const STROKE_WIDTH = 0.5

const skinsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/skins')
const bravuraContents = new Set(
  [bravuraGlyphsByKey, bravuraStaffTimeSignatures, bravuraNumberNotationGlyphs]
    .flatMap((group) => Object.values(group).map((g) => g.content)),
)

function bravuraKeys(pack: Pack): string[] {
  return Object.keys(pack).filter((k) => bravuraContents.has(pack[k]!.content))
}

function inkFromSkin(skin: SkinJson): string {
  const slur = skin.standardStaff?.slur?.content?.trim() ?? ''
  const m = slur.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return `rgb(${m[1]},${m[2]},${m[3]})`
  if (slur.startsWith('#') || slur.startsWith('rgb')) return slur
  return '#000000'
}

/** 从主题项中取 defs 与主形状的 fill / stroke */
function themePaint(themeItem: Item | undefined, ink: string) {
  const content = themeItem?.content ?? ''
  const defs = content.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? ''
  const body = defs ? content.slice(content.indexOf(defs) + defs.length) : content
  const defsStroke = defs.match(/id="([\w-]*Stroke)"/)?.[1]
  const shape = body.match(/<(?:path|rect|ellipse|circle|polygon)\b[^>]*\bfill="url\(#[\w-]+\)"[^>]*>/)?.[0]
  if (shape) {
    const fill = shape.match(/\bfill="([^"]+)"/)![1]!
    const stroke = shape.match(/\bstroke="([^"]+)"/)?.[1] ?? (defsStroke ? `url(#${defsStroke})` : fill)
    return {defs, fill, stroke}
  }
  // 原形状只描边或是文字：填充取 defs 里的 *Fill（或第一个渐变），描边沿用原描边色
  const fillId = defs.match(/id="([\w-]*Fill)"/)?.[1] ?? defs.match(/<(?:linear|radial)Gradient\b[^>]*id="([\w-]+)"/)?.[1]
  if (!fillId) return {defs: '', fill: ink, stroke: ink}
  const fill = `url(#${fillId})`
  const bodyStroke = [...body.matchAll(/\bstroke="([^"]+)"/g)].map((m) => m[1]!).find((s) => s !== 'none' && s !== 'transparent')
  return {defs, fill, stroke: bodyStroke ?? (defsStroke ? `url(#${defsStroke})` : ink)}
}

function themedItem(base: Item, themeItem: Item | undefined, ink: string): Item {
  const {defs, fill, stroke} = themePaint(themeItem, ink)
  const shape = base.content.replace(
    /fill="black"/g,
    `fill="${fill}" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"`,
  )
  return {...structuredClone(base), content: defs + shape}
}

function sync(file: string, mapItem: (base: Item, old: Item | undefined, skin: SkinJson) => Item) {
  const p = path.join(skinsDir, `${file}.json`)
  const skin = JSON.parse(fs.readFileSync(p, 'utf8')) as SkinJson
  const counts: string[] = []
  for (const packName of PACKS) {
    const basePack = defaultSkin[packName] as unknown as Pack | undefined
    if (!basePack || !skin[packName]) continue
    const keys = bravuraKeys(basePack)
    for (const k of keys) skin[packName]![k] = mapItem(basePack[k]!, skin[packName]![k], skin)
    counts.push(`${packName}:${keys.length}`)
  }
  fs.writeFileSync(p, `${JSON.stringify(skin, null, 2)}\n`)
  console.log(file, counts.join(' '))
}

sync('default', (base) => structuredClone(base))
for (const theme of THEMES) {
  sync(theme, (base, old, skin) => themedItem(base, old, inkFromSkin(skin)))
}
