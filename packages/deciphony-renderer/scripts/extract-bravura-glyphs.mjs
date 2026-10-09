/**
 * 从 Bravura.otf 抽出 SMuFL 字形 path，生成 defaultSkin 可用的 SkinItem。
 * 依赖：scripts/bravura/Bravura.otf、opentype.js
 * 运行：node scripts/extract-bravura-glyphs.mjs
 *
 * Bravura © Steinberg Media Technologies GmbH，SIL Open Font License 1.1
 */
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'

const require = createRequire(import.meta.url)
const opentype = require('opentype.js')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OTF = path.join(__dirname, 'bravura/Bravura.otf')
const OUT = path.join(ROOT, 'src/skins/generated/bravuraStandardStaff.ts')
const LINE_OUT = path.join(ROOT, 'src/skins/generated/bravuraLineGlyphs.ts')

/** 横向线条符号（颤音线等）拼接用字形：不进皮肤，组件按 advance 平铺、颜色走皮肤 */
const LINE_GLYPHS = {
  ornamentTrill: 0xe566,
  wiggleTrill: 0xeaa4,
  ornamentZigZagLineNoRightEnd: 0xe59d,
  ornamentZigZagLineWithRightEnd: 0xe59e,
  ornamentBottomLeftConcaveStroke: 0xe59a,
  ornamentLeftVerticalStroke: 0xe594,
  // 琶音：横向字形，组件旋转后沿琶音方向平铺；UpArrow 箭头尖在右端，DownArrow 箭头尖在左端
  wiggleArpeggiatoUp: 0xeaa9,
  wiggleArpeggiatoDown: 0xeaaa,
  wiggleArpeggiatoUpArrow: 0xeaad,
  wiggleArpeggiatoDownArrow: 0xeaae,
}

/** 与 defaultSkin 一致：五线总高 45 ≈ 4 个 staff space（SMuFL: 1em = 4 spaces） */
const FONT_SIZE = 45

/** skinKey → SMuFL codepoint */
const MAP = {
  treble: 0xe050,
  treble_f: 0xe050,
  alto: 0xe05c,
  alto_f: 0xe05c,
  bass: 0xe062,
  bass_f: 0xe062,
  Tenor: 0xe05c,
  tenor_f: 0xe05c,
  sharp: 0xe262,
  flat: 0xe260,
  natural: 0xe261,
  double_sharp: 0xe263,
  double_flat: 0xe264,
  noteHead_1: 0xe0a2,
  noteHead_2: 0xe0a3,
  noteHead_3: 0xe0a4,
  noteTail_1: 0xe240,
  noteTail_2: 0xe242,
  noteTail_3: 0xe244,
  noteTail_4: 0xe246,
  noteTail_5: 0xe248,
  noteTail_6: 0xe24a,
  noteTail_1_r: 0xe241,
  noteTail_2_r: 0xe243,
  noteTail_3_r: 0xe245,
  noteTail_4_r: 0xe247,
  noteTail_5_r: 0xe249,
  noteTail_6_r: 0xe24b,
  rest_1: 0xe4e3,
  rest_2: 0xe4e4,
  rest_3: 0xe4e5,
  rest_4: 0xe4e6,
  rest_5: 0xe4e7,
  rest_6: 0xe4e8,
  rest_7: 0xe4e9,
  rest_8: 0xe4ea,
  rest_9: 0xe4eb,
  augmentationDot_1: 0xe1e7,
  // brace / bracket 不取 Bravura：固定高度字形无法随复谱表高度（node.h）拉伸
  repeat_coda: 0xe048,
  repeat_segno: 0xe047,
  // articulations (SMuFL artic*Above)
  acccent_above: 0xe4a0,
  staccato_above: 0xe4a2,
  staccatissimo_above: 0xe4a6,
  tenuto_above: 0xe4a4,
  staccatissimo_wedge_above: 0xe4a6,
  staccatissimo_stroke_above: 0xe4aa,
  marcato_above: 0xe4ac,
  marcato_staccato_above: 0xe4ae,
  accent_staccato_above: 0xe4b0,
  loure_above: 0xe4b2,
  stress_above: 0xe4b6,
  unstress_above: 0xe4b8,
  tenuto_accent_above: 0xe4ba,
  marcato_tenuto_above: 0xe4bc,
  // breath
  breath: 0xe4ce,
  turn: 0xe567,
  invertedTurn: 0xe568,
  trill: 0xe566,
  shortTrill: 0xe56c,
  mordent: 0xe56d,
  up_bow: 0xe612,
  down_bow: 0xe610,
  open: 0xe7f8,
  muted: 0xe5e5,
  harmonic: 0xe1d9,
  // dynamics（SMuFL 无独立 dyn_sff，跳过）
  dyn_ppp: 0xe52a,
  dyn_pp: 0xe52b,
  dyn_p: 0xe520,
  dyn_mp: 0xe52c,
  dyn_mf: 0xe52d,
  dyn_f: 0xe522,
  dyn_ff: 0xe52f,
  dyn_fff: 0xe530,
  dyn_fp: 0xe534,
  dyn_pf: 0xe52e,
  dyn_sf: 0xe536,
  dyn_sfz: 0xe539,
  dyn_sffz: 0xe53b,
  dyn_sfp: 0xe53a,
  dyn_rfz: 0xe53d,
  dyn_rf: 0xe53c,
  dyn_fz: 0xe535,
  common: 0xe08a,
  cut: 0xe08b,
  // 前奏括号（拍号括号字形，约一节五线高）
  prelude_bracket_left: 0xe094, // timeSigParensLeft
  prelude_bracket_right: 0xe095, // timeSigParensRight
  // 鼓谱专用
  percussion: 0xe069,
  percussion_f: 0xe069,
  drumHead_cross: 0xe0a9,
  drumHead_circledCross: 0xe0b3,
  drumHead_normal: 0xe0a4,
  drumHead_triangle: 0xe0be,
  drumHead_diamond: 0xe0db,
  // drumHead_circledSlash：SMuFL 无「圆圈 + /」，见 composeCircledSlash
}

const ENUM_NAME = {
  treble: 'Treble',
  treble_f: 'Treble_f',
  alto: 'Alto',
  alto_f: 'Alto_f',
  bass: 'Bass',
  bass_f: 'Bass_f',
  Tenor: 'Tenor',
  tenor_f: 'Tenor_f',
  sharp: 'Sharp',
  flat: 'Flat',
  natural: 'Natural',
  double_sharp: 'Double_sharp',
  double_flat: 'Double_flat',
  noteHead_1: 'NoteHead_1',
  noteHead_2: 'NoteHead_2',
  noteHead_3: 'NoteHead_3',
  noteTail_1: 'NoteTail_1',
  noteTail_2: 'NoteTail_2',
  noteTail_3: 'NoteTail_3',
  noteTail_4: 'NoteTail_4',
  noteTail_5: 'NoteTail_5',
  noteTail_6: 'NoteTail_6',
  noteTail_1_r: 'NoteTail_1_r',
  noteTail_2_r: 'NoteTail_2_r',
  noteTail_3_r: 'NoteTail_3_r',
  noteTail_4_r: 'NoteTail_4_r',
  noteTail_5_r: 'NoteTail_5_r',
  noteTail_6_r: 'NoteTail_6_r',
  rest_1: 'Rest_1',
  rest_2: 'Rest_2',
  rest_3: 'Rest_3',
  rest_4: 'Rest_4',
  rest_5: 'Rest_5',
  rest_6: 'Rest_6',
  rest_7: 'Rest_7',
  rest_8: 'Rest_8',
  rest_9: 'Rest_9',
  augmentationDot_1: 'AugmentationDot_1',
  augmentationDot_2: 'AugmentationDot_2',
  augmentationDot_3: 'AugmentationDot_3',
  repeat_coda: 'Repeat_coda',
  repeat_segno: 'Repeat_segno',
  acccent_above: 'Accent_above',
  staccato_above: 'Staccato_above',
  staccatissimo_above: 'Staccatissimo_above',
  tenuto_above: 'Tenuto_above',
  staccatissimo_wedge_above: 'Staccatissimo_wedge_above',
  staccatissimo_stroke_above: 'Staccatissimo_stroke_above',
  marcato_above: 'Marcato_above',
  marcato_staccato_above: 'Marcato_staccato_above',
  accent_staccato_above: 'Accent_staccato_above',
  loure_above: 'Loure_above',
  stress_above: 'Stress_above',
  unstress_above: 'Unstress_above',
  tenuto_accent_above: 'Tenuto_accent_above',
  marcato_tenuto_above: 'Marcato_tenuto_above',
  breath: 'Breath',
  prelude_bracket_left: 'Prelude_bracket_left',
  prelude_bracket_right: 'Prelude_bracket_right',
  turn: 'Turn',
  invertedTurn: 'InvertedTurn',
  trill: 'Trill',
  shortTrill: 'ShortTrill',
  mordent: 'Mordent',
  up_bow: 'Up_bow',
  down_bow: 'Down_bow',
  open: 'Open',
  muted: 'Muted',
  harmonic: 'Harmonic',
  dyn_ppp: 'Dyn_PPP',
  dyn_pp: 'Dyn_PP',
  dyn_p: 'Dyn_P',
  dyn_mp: 'Dyn_MP',
  dyn_mf: 'Dyn_MF',
  dyn_f: 'Dyn_F',
  dyn_ff: 'Dyn_FF',
  dyn_fff: 'Dyn_FFF',
  dyn_fp: 'Dyn_FP',
  dyn_pf: 'Dyn_PF',
  dyn_sf: 'Dyn_SF',
  dyn_sfz: 'Dyn_SFZ',
  dyn_sffz: 'Dyn_SFFZ',
  dyn_sfp: 'Dyn_SFP',
  dyn_rfz: 'Dyn_RFZ',
  dyn_rf: 'Dyn_RF',
  dyn_fz: 'Dyn_FZ',
  common: 'Common',
  cut: 'Cut',
  // drum extras stored under StandardStaffSkinKeyEnum won't work — emit as string-keyed companion
}

const WIDTH_RATIO = {
  noteHead_1: 6,
  noteHead_2: 6,
  noteHead_3: 6,
  drumHead_normal: 6,
  drumHead_cross: 6,
  drumHead_circledCross: 6,
  drumHead_triangle: 6,
  drumHead_diamond: 6,
  drumHead_circledSlash: 6,
  treble: 10,
  treble_f: 10,
  alto: 10,
  alto_f: 10,
  bass: 10,
  bass_f: 10,
  Tenor: 10,
  tenor_f: 10,
  percussion: 10,
  percussion_f: 10,
}

const WIDTH_RATIO_FOR_MEASURE = {
  treble: 18,
  treble_f: 18,
  alto: 18,
  alto_f: 18,
  bass: 18,
  bass_f: 18,
  Tenor: 18,
  tenor_f: 18,
  percussion: 18,
  percussion_f: 18,
}

/** 字形左右留白（px），写进 content 平移与 w；谱号排在小节最前，贴着闭合线会显得挤 */
const SIDE_PAD = {
  percussion: {left: 4, right: 5.5},
  percussion_f: {left: 4, right: 5.5},
}

/** 字形整体缩放，写进 content 与 w/h；原字号的 coda / segno 比五线谱还高 */
const GLYPH_SCALE = {
  repeat_coda: 0.6,
  repeat_segno: 0.6,
  // 拍号括号原高≈整节五线，前奏括号只需约半高
  prelude_bracket_left: 0.5,
  prelude_bracket_right: 0.5,
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function withScale(key, item) {
  const s = GLYPH_SCALE[key]
  if (!s) return item
  return {
    ...item,
    content: `<g transform="scale(${s})">${item.content}</g>`,
    w: round2(item.w * s),
    h: round2(item.h * s),
  }
}

function withSidePad(key, item) {
  const pad = SIDE_PAD[key]
  if (!pad) return item
  return {
    ...item,
    content: `<g transform="translate(${pad.left}, 0)">${item.content}</g>`,
    w: round2(item.w + pad.left + pad.right),
  }
}

function extractGlyph(font, codepoint, fontSize = FONT_SIZE) {
  const glyph = font.charToGlyph(String.fromCodePoint(codepoint))
  if (!glyph || glyph.index === 0) {
    throw new Error(`missing glyph U+${codepoint.toString(16)}`)
  }
  const pathObj = glyph.getPath(0, 0, fontSize)
  const box = pathObj.getBoundingBox()
  const w = Math.max(0.5, box.x2 - box.x1)
  const h = Math.max(0.5, box.y2 - box.y1)
  const d = pathObj.toPathData(2)
  const content = `<g transform="translate(${round2(-box.x1)}, ${round2(-box.y1)})"><path d="${d}" fill="black" fill-rule="evenodd"/></g>`
  return {content, w: round2(w), h: round2(h)}
}

/**
 * 圆圈 + /：取 noteheadCircleX（U+E0B3）的外圆尺寸，圆环厚度与笔画宽度按 Bravura 该字形实测，
 * 去掉 \ 只留 /（内圆被 / 分成左上、右下两个镂空）。
 */
function composeCircledSlash(font) {
  const ref = extractGlyph(font, 0xe0b3)
  const cx = ref.w / 2
  const cy = ref.h / 2
  const R = Math.min(ref.w, ref.h) / 2
  const r = R - 1.3
  const t = 1.27 / 2
  const L = Math.sqrt(r * r - t * t)
  const d = [Math.SQRT1_2, -Math.SQRT1_2]
  const hole = (n) => {
    const p1 = [cx + n[0] * t + d[0] * L, cy + n[1] * t + d[1] * L]
    const p2 = [cx + n[0] * t - d[0] * L, cy + n[1] * t - d[1] * L]
    const ang = (p) => Math.atan2(p[1] - cy, p[0] - cx)
    const a1 = ang(p1)
    const span = (x) => ((x - a1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const sweep = span(Math.atan2(n[1], n[0])) < span(ang(p2)) ? 1 : 0
    const f = (p) => `${round2(p[0])} ${round2(p[1])}`
    return `M${f(p1)}A${round2(r)} ${round2(r)} 0 0 ${sweep} ${f(p2)}Z`
  }
  const outer = `M${round2(cx - R)} ${round2(cy)}A${round2(R)} ${round2(R)} 0 1 0 ${round2(cx + R)} ${round2(cy)}A${round2(R)} ${round2(R)} 0 1 0 ${round2(cx - R)} ${round2(cy)}Z`
  const d1 = hole([-Math.SQRT1_2, -Math.SQRT1_2])
  const d2 = hole([Math.SQRT1_2, Math.SQRT1_2])
  return {
    content: `<path d="${outer}${d1}${d2}" fill="black" fill-rule="evenodd"/>`,
    w: ref.w,
    h: ref.h,
  }
}

/** SMuFL timeSig0–9；拍号数字以基线为垂直中心（上下各 1 个 staff space） */
const TIME_SIG_DIGIT_CP = 0xe080
/** 多位数拍号（12/8 等）数字间距，按 FONT_SIZE 比例缩放 */
const TIME_SIG_DIGIT_GAP = 0.6

/** 五线谱 / 鼓谱：数字缩到 86% 并上下略分开，避免在第 3 线处粘连；盒高 = 五线高 */
const STAFF_TIME_SIG = {fontSize: FONT_SIZE * 0.86, rowCenters: [10.75, 34.25], h: FONT_SIZE, padX: 4}

/** 简谱拍号：数字与简谱音符数字等高（≈16.5）；音符数字本身保持普通字体 text */
const NUMBER_TIME_SIG = {fontSize: FONT_SIZE * 0.73, rowCenters: [9.75, 30.25], h: 40, padX: 3}

/** 简谱变音：与五线谱同形，字号减半（升号高 ≈ 15.7，与简谱数字相当）；渲染时盒顶对齐数字顶 */
const NUMBER_ACCIDENTAL_FONT_SIZE = FONT_SIZE * 0.5
const NUMBER_ACCIDENTALS = ['sharp', 'flat', 'natural', 'double_sharp', 'double_flat']

function composeNumberAccidentals(font) {
  const out = {}
  for (const key of NUMBER_ACCIDENTALS) {
    out[key] = {...extractGlyph(font, MAP[key], NUMBER_ACCIDENTAL_FONT_SIZE), widthRatio: 10, widthRatioForMeasure: 10, skinKey: key}
  }
  // 重升号字形很矮，盒高取升号高并垂直居中，免得贴在数字顶上
  const ds = out.double_sharp
  const boxH = out.sharp.h
  ds.content = `<g transform="translate(0, ${round2((boxH - ds.h) / 2)})">${ds.content}</g>`
  ds.h = boxH
  return out
}

function readFractionTimeSignatureKeys() {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/timeSignature.ts'), 'utf8')
  const block = src.match(/FRACTION_TIME_SIGNATURE_KEYS\s*=\s*\[([\s\S]*?)\]/)
  if (!block) throw new Error('FRACTION_TIME_SIGNATURE_KEYS not found')
  return [...block[1].matchAll(/'(\d+_\d+)'/g)].map((m) => m[1])
}

function glyphOf(font, codepoint) {
  const glyph = font.charToGlyph(String.fromCodePoint(codepoint))
  if (!glyph || glyph.index === 0) throw new Error(`missing glyph U+${codepoint.toString(16)}`)
  return glyph
}

/** 字形基线放在 (x, baselineY)，x 为包围盒左缘；返回 path d 与宽度 */
function placeGlyph(font, codepoint, fontSize, left, baselineY) {
  const glyph = glyphOf(font, codepoint)
  const box = glyph.getPath(0, 0, fontSize).getBoundingBox()
  const d = glyph.getPath(left - box.x1, baselineY, fontSize).toPathData(2)
  return {d, w: box.x2 - box.x1}
}

function glyphWidth(font, codepoint, fontSize) {
  const box = glyphOf(font, codepoint).getPath(0, 0, fontSize).getBoundingBox()
  return box.x2 - box.x1
}

function digitsRowWidth(font, digits, fontSize) {
  const gap = TIME_SIG_DIGIT_GAP * fontSize / FONT_SIZE
  return [...digits].reduce((sum, ch, i) => sum + glyphWidth(font, TIME_SIG_DIGIT_CP + Number(ch), fontSize) + (i ? gap : 0), 0)
}

function composeTimeSignature(font, key, layout) {
  const rows = key.split('_')
  const gap = TIME_SIG_DIGIT_GAP * layout.fontSize / FONT_SIZE
  const widths = rows.map((r) => digitsRowWidth(font, r, layout.fontSize))
  const w = Math.max(...widths) + layout.padX * 2
  const ds = []
  rows.forEach((row, i) => {
    let x = (w - widths[i]) / 2
    for (const ch of row) {
      const placed = placeGlyph(font, TIME_SIG_DIGIT_CP + Number(ch), layout.fontSize, x, layout.rowCenters[i])
      ds.push(placed.d)
      x += placed.w + gap
    }
  })
  return {
    content: `<path d="${ds.join('')}" fill="black" fill-rule="evenodd"/>`,
    w: round2(w),
    h: layout.h,
    widthRatio: 0,
    widthRatioForMeasure: 0,
    skinKey: key,
  }
}

/** 原点 = 字形基线起点（不平移），advance 为平铺步长 */
function extractLineGlyph(font, codepoint) {
  const glyph = glyphOf(font, codepoint)
  const p = glyph.getPath(0, 0, FONT_SIZE)
  const box = p.getBoundingBox()
  return {
    d: p.toPathData(2),
    advance: round2(glyph.advanceWidth * FONT_SIZE / font.unitsPerEm),
    x1: round2(box.x1),
    y1: round2(box.y1),
    x2: round2(box.x2),
    y2: round2(box.y2),
  }
}

function writeLineGlyphs(font) {
  const lines = Object.entries(LINE_GLYPHS).map(
    ([name, cp]) => `  ${name}: ${JSON.stringify(extractLineGlyph(font, cp))},`,
  )
  const ts = `/* eslint-disable */
/**
 * AUTO-GENERATED by scripts/extract-bravura-glyphs.mjs — do not edit by hand.
 * Glyphs from Bravura (Steinberg), SIL Open Font License 1.1.
 * fontSize=${FONT_SIZE}；path 原点 = 基线起点（y 向下为正），advance = 平铺步长。
 */
export type BravuraLineGlyph = {
  d: string
  advance: number
  x1: number
  y1: number
  x2: number
  y2: number
}

export const bravuraLineGlyphs = {
${lines.join('\n')}
} satisfies Record<string, BravuraLineGlyph>
`
  fs.writeFileSync(LINE_OUT, ts, 'utf8')
  console.log('Wrote', LINE_OUT)
}

function withMeta(key, base) {
  const item = {...base, skinKey: key}
  if (WIDTH_RATIO[key] != null) item.widthRatio = WIDTH_RATIO[key]
  if (WIDTH_RATIO_FOR_MEASURE[key] != null) item.widthRatioForMeasure = WIDTH_RATIO_FOR_MEASURE[key]
  return item
}

function main() {
  if (!fs.existsSync(OTF)) {
    console.error('Missing', OTF)
    process.exit(1)
  }
  const font = opentype.parse(fs.readFileSync(OTF).buffer)
  /** @type {Record<string, object>} */
  const items = {}
  const missing = []

  for (const [key, cp] of Object.entries(MAP)) {
    try {
      items[key] = withMeta(key, withSidePad(key, withScale(key, extractGlyph(font, cp))))
    } catch (e) {
      missing.push(`${key} U+${cp.toString(16)}: ${e.message}`)
    }
  }

  items.drumHead_circledSlash = withMeta('drumHead_circledSlash', composeCircledSlash(font))

  const one = extractGlyph(font, 0xe1e7)
  const gap = round2(one.w * 1.6)
  items.augmentationDot_1 = withMeta('augmentationDot_1', one)
  items.augmentationDot_2 = withMeta('augmentationDot_2', {
    content: `<g>${one.content}<g transform="translate(${gap},0)">${one.content}</g></g>`,
    w: round2(one.w + gap),
    h: one.h,
  })
  items.augmentationDot_3 = withMeta('augmentationDot_3', {
    content: `<g>${one.content}<g transform="translate(${gap},0)">${one.content}</g><g transform="translate(${gap * 2},0)">${one.content}</g></g>`,
    w: round2(one.w + gap * 2),
    h: one.h,
  })

  const staffLines = Object.entries(items)
    .filter(([key]) => ENUM_NAME[key])
    .map(([key, item]) => {
      return `  [StandardStaffSkinKeyEnum.${ENUM_NAME[key]}]: ${JSON.stringify(item)},`
    })

  const byKeyLines = Object.entries(items).map(
    ([key, item]) => `  ${JSON.stringify(key)}: ${JSON.stringify(item)},`,
  )

  const fractionKeys = readFractionTimeSignatureKeys()
  const staffTimeSigLines = fractionKeys.map(
    (key) => `  ${JSON.stringify(key)}: ${JSON.stringify(composeTimeSignature(font, key, STAFF_TIME_SIG))},`,
  )
  const numberItems = {}
  for (const key of fractionKeys) numberItems[key] = composeTimeSignature(font, key, NUMBER_TIME_SIG)
  Object.assign(numberItems, composeNumberAccidentals(font))
  const numberLines = Object.entries(numberItems).map(
    ([key, item]) => `  ${JSON.stringify(key)}: ${JSON.stringify(item)},`,
  )

  const ts = `/* eslint-disable */
/**
 * AUTO-GENERATED by scripts/extract-bravura-glyphs.mjs — do not edit by hand.
 * Glyphs from Bravura (Steinberg), SIL Open Font License 1.1.
 * Staff scale: fontSize=${FONT_SIZE} (1 staff space = ${FONT_SIZE / 4}).
 */
import type {SkinItem} from '@/types/common'
import {StandardStaffSkinKeyEnum} from '@/standardStaff/enums/standardStaffSkinKeyEnum'

/** 全量字形表（按 skinKey 字符串），供简谱 / tab / 鼓谱 overlay */
export const bravuraGlyphsByKey: Record<string, SkinItem> = {
${byKeyLines.join('\n')}
}

export const bravuraStandardStaffPartial: Partial<Record<StandardStaffSkinKeyEnum, SkinItem>> = {
${staffLines.join('\n')}
}

/** 五线谱 / 鼓谱分数拍号（timeSig0–9 拼合，盒高 = 五线高）；不进 bravuraGlyphsByKey，避免 overlay 到 tab */
export const bravuraStaffTimeSignatures: Record<string, SkinItem> = {
${staffTimeSigLines.join('\n')}
}

/** 简谱分数拍号 + 变音记号，按简谱数字尺寸缩放（在 overlay 之后展开，覆盖五线谱尺寸的变音） */
export const bravuraNumberNotationGlyphs: Record<string, SkinItem> = {
${numberLines.join('\n')}
}

export const BRAVURA_SKIN_ATTRIBUTION =
  'Bravura music font © Steinberg Media Technologies GmbH (SIL OFL 1.1)'
`

  fs.mkdirSync(path.dirname(OUT), {recursive: true})
  fs.writeFileSync(OUT, ts, 'utf8')
  writeLineGlyphs(font)
  console.log('Wrote', OUT, 'keys=', Object.keys(items).length, 'staff=', staffLines.length,
    'timeSig=', staffTimeSigLines.length, 'number=', numberLines.length)
  if (missing.length) console.warn('Missing:\n' + missing.join('\n'))
}

main()
