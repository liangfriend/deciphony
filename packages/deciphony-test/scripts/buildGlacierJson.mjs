/**
 * 由 cosmos.json（完整渐变结构）生成 glacier.json，替换为冰川配色与装饰。
 * 用法：node packages/deciphony-test/scripts/buildGlacierJson.mjs
 */
import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const skinsDir = path.join(__dirname, '../src/views/skins')

const LC_DEFS = `<defs>
  <linearGradient id="lcFill" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="rgba(232,247,255,0.72)"/>
    <stop offset="38%" stop-color="rgba(142,208,235,0.78)"/>
    <stop offset="72%" stop-color="rgba(54,134,170,0.88)"/>
    <stop offset="100%" stop-color="rgba(12,45,72,0.95)"/>
  </linearGradient>
  <linearGradient id="lcFillLight" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgba(240,251,255,0.35)"/>
    <stop offset="100%" stop-color="rgba(168,216,232,0.28)"/>
  </linearGradient>
  <linearGradient id="lcStroke" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgba(29,78,111,0.95)"/>
    <stop offset="100%" stop-color="rgba(12,45,72,1)"/>
  </linearGradient>
  <linearGradient id="lcStem" x1="0%" y1="100%" x2="0%" y2="0%">
    <stop offset="0%" stop-color="rgba(12,45,72,0.65)"/>
    <stop offset="35%" stop-color="rgba(43,122,158,0.98)"/>
    <stop offset="68%" stop-color="rgba(126,200,227,0.92)"/>
    <stop offset="100%" stop-color="rgba(12,45,72,0.55)"/>
  </linearGradient>
  <linearGradient id="lcDigit" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="rgba(232,247,255,1)"/>
    <stop offset="45%" stop-color="rgba(126,200,227,1)"/>
    <stop offset="100%" stop-color="rgba(29,78,111,1)"/>
  </linearGradient>
  <radialGradient id="lcCore" cx="50%" cy="38%" r="58%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.98)"/>
    <stop offset="32%" stop-color="rgba(200,235,250,0.9)"/>
    <stop offset="65%" stop-color="rgba(100,180,215,0.75)"/>
    <stop offset="100%" stop-color="rgba(43,122,158,0.65)"/>
  </radialGradient>
  <radialGradient id="lcAura" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgba(130,210,235,0.22)"/>
    <stop offset="45%" stop-color="rgba(90,180,210,0.12)"/>
    <stop offset="100%" stop-color="rgba(43,122,158,0)"/>
  </radialGradient>
  <linearGradient id="lcBg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="rgba(210,240,252,0.14)"/>
    <stop offset="55%" stop-color="rgba(168,216,232,0.09)"/>
    <stop offset="100%" stop-color="rgba(43,122,158,0.13)"/>
  </linearGradient>
  <linearGradient id="lcSheen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
    <stop offset="45%" stop-color="rgba(230,248,255,0.32)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </linearGradient>
</defs>`

const LC_MEASURE_BODY = `<rect x="0" y="0" width="node.w" height="node.h" fill="url(#lcBg)"/>
<ellipse cx="calc(node.w*0.28)" cy="18" rx="calc(node.w*0.22)" ry="20" fill="url(#lcAura)"/>
<ellipse cx="calc(node.w*0.78)" cy="30" rx="calc(node.w*0.18)" ry="16" fill="url(#lcAura)"/>
<rect x="0" y="0" width="node.w" height="node.h" fill="url(#lcSheen)" opacity="0.4"/>
<g opacity="0.62" stroke="rgba(168,216,232,0.85)" fill="none" stroke-width="0.42" stroke-linecap="round">
  <path d="M calc(node.w*0.07),7 l0,4.5 M calc(node.w*0.07),5 l-1.6,1.6 1.6,1.6 M calc(node.w*0.07),9.5 l1.6,1.6 -1.6,1.6"/>
  <path d="M calc(node.w*0.9),33 l0,4 M calc(node.w*0.9),31.5 l-1.4,1.4 1.4,1.4 M calc(node.w*0.9),35.5 l1.4,1.4 -1.4,1.4"/>
  <path d="M calc(node.w*0.45),5 l0,3.2 M calc(node.w*0.45),3.8 l-1.1,1.1 1.1,1.1 M calc(node.w*0.45),6.2 l1.1,1.1 -1.1,1.1"/>
</g>
<circle cx="calc(node.w*0.14)" cy="37" r="0.75" fill="rgba(230,248,255,0.85)"/>
<circle cx="calc(node.w*0.58)" cy="7" r="0.6" fill="rgba(184,232,248,0.75)"/>
<circle cx="calc(node.w*0.92)" cy="21" r="0.55" fill="rgba(200,235,250,0.7)"/>
<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="rgba(43,122,158,0.45)" stroke-width="1"/>
<line x1="0" y1="11.5" x2="node.w" y2="11.5" stroke="rgba(43,122,158,0.45)" stroke-width="1"/>
<line x1="0" y1="22.5" x2="node.w" y2="22.5" stroke="rgba(54,134,170,0.55)" stroke-width="1.1"/>
<line x1="0" y1="33.5" x2="node.w" y2="33.5" stroke="rgba(43,122,158,0.45)" stroke-width="1"/>
<line x1="0" y1="44.5" x2="node.w" y2="44.5" stroke="rgba(43,122,158,0.45)" stroke-width="1"/>`

const LC_CLEF_SPARKLE = `<g stroke="none" opacity="0.78">
  <circle cx="calc(node.w*0.82)" cy="calc(node.h*0.1)" r="calc(node.w*0.035)" fill="rgba(230,248,255,0.9)"/>
  <circle cx="calc(node.w*0.12)" cy="calc(node.h*0.46)" r="calc(node.w*0.025)" fill="rgba(184,232,248,0.75)"/>
  <circle cx="calc(node.w*0.7)" cy="calc(node.h*0.82)" r="calc(node.w*0.022)" fill="rgba(200,235,250,0.7)"/>
  <circle cx="calc(node.w*0.28)" cy="calc(node.h*0.2)" r="calc(node.w*0.018)" fill="rgba(255,255,255,0.85)"/>
</g>`

const COSMOS_CLEF_SPARKLE_RE = /<g stroke="none">\s*<circle cx="calc\(node\.w\*0\.82\)"[\s\S]*?<\/g>/

/** 五线谱分母分子拍号：六棱冰晶外框（h=56，包住 y=24/46、font-size=22） */
const LC_TIME_SIG_CRYSTAL = `<g>
  <polygon points="15,2 27,9 27,41 15,53 3,41 3,9" fill="url(#lcFillLight)" stroke="url(#lcStroke)" stroke-width="0.85" stroke-linejoin="miter"/>
  <line x1="15" y1="2" x2="15" y2="53" stroke="url(#lcStroke)" stroke-width="0.35" opacity="0.32"/>
  <line x1="3" y1="9" x2="27" y2="41" stroke="url(#lcStroke)" stroke-width="0.3" opacity="0.22"/>
  <line x1="27" y1="9" x2="3" y2="41" stroke="url(#lcStroke)" stroke-width="0.3" opacity="0.22"/>
  <path d="M25,8 l0.45,1.3 1.3,0.45 -1.3,0.45 -0.45,1.3 -0.45,-1.3 -1.3,-0.45 1.3,-0.45 Z" fill="rgba(230,248,255,0.9)"/>
</g>`

/** common / cut：六棱框（包住 y=35、font-size=28 的 C） */
const LC_COMMON_CRYSTAL = `<polygon points="15,8 25,14 25,37 15,42 5,37 5,14" fill="url(#lcFillLight)" stroke="url(#lcStroke)" stroke-width="0.75" stroke-linejoin="miter"/>
  <line x1="15" y1="8" x2="15" y2="42" stroke="url(#lcStroke)" stroke-width="0.3" opacity="0.28"/>
  <line x1="5" y1="14" x2="25" y2="37" stroke="url(#lcStroke)" stroke-width="0.25" opacity="0.18"/>
  <line x1="25" y1="14" x2="5" y2="37" stroke="url(#lcStroke)" stroke-width="0.25" opacity="0.18"/>`

const COSMOS_TIME_SIG_ELLIPSE_RE = /<g>\s*<ellipse cx="15" cy="28" rx="13\.5" ry="26"[\s\S]*?<\/g>/

/** 旧版偏矮的六棱框（底仅到 y=44，会裁切 y=46 文字） */
const LEGACY_TIME_SIG_CRYSTAL_RE = /<g>\s*<polygon points="15,1 27,8 27,38 15,44 3,38 3,8"[\s\S]*?<\/g>/

const TIME_SIG_KEYS = new Set([
  '2_4', '3_4', '4_4', '5_4', '6_4',
  '3_8', '4_8', '5_8', '6_8', '7_8', '9_8', '12_8',
  'common', 'cut',
  '2_2', '3_2', '4_2',
])

const GEOMETRY_COLOR = 'rgba(43,122,158,0.92)'

function replaceDefs(content) {
  if (!content.includes('<defs>')) return content
  return content.replace(/<defs>[\s\S]*?<\/defs>/, LC_DEFS)
}

function remapIds(content) {
  return content
    .replace(/url\(#hy/g, 'url(#lc')
    .replace(/\bhyFill\b/g, 'lcFill')
    .replace(/\bhyFillLight\b/g, 'lcFillLight')
    .replace(/\bhyStroke\b/g, 'lcStroke')
    .replace(/\bhyStem\b/g, 'lcStem')
    .replace(/\bhyDigit\b/g, 'lcDigit')
    .replace(/\bhyCore\b/g, 'lcCore')
    .replace(/\bhyNebula\b/g, 'lcAura')
    .replace(/\bhyBg\b/g, 'lcBg')
}

function applyTextTheme(content) {
  return content
    .replace(/stroke="rgba\(44,36,96[^"]*\)"/g, 'stroke="rgba(29,78,111,0.75)"')
    .replace(/stroke="rgba\(206,116,58[^"]*\)"/g, 'stroke="rgba(29,78,111,0.75)"')
    .replace(/fill="rgba\(46,40,120[^"]*\)"/g, 'fill="rgba(12,45,72,0.96)"')
}

function isTimeSignatureKey(key) {
  return TIME_SIG_KEYS.has(key) || /^\d+_\d+$/.test(key)
}

function applyTimeSignatureStyle(key, content) {
  if (!isTimeSignatureKey(key) || !content.includes('<text')) return content

  let out = content

  if (COSMOS_TIME_SIG_ELLIPSE_RE.test(out)) {
    out = out.replace(COSMOS_TIME_SIG_ELLIPSE_RE, LC_TIME_SIG_CRYSTAL)
  } else if (LEGACY_TIME_SIG_CRYSTAL_RE.test(out)) {
    out = out.replace(LEGACY_TIME_SIG_CRYSTAL_RE, LC_TIME_SIG_CRYSTAL)
  } else if (key === 'common' || key === 'cut') {
    if (!out.includes('<polygon')) {
      out = out.replace(/<g>\s*<text/, `<g>\n${LC_COMMON_CRYSTAL}\n  <text`)
    }
  } else if (out.includes('y="24"') && out.includes('y="46"') && !out.includes('<polygon')) {
    out = out.replace(/<g>\s*<text/, `<g>\n${LC_TIME_SIG_CRYSTAL}\n  <text`)
  }

  // 拍号数字：深色实填，保证小字号可读
  out = out.replace(
    /(<text[^>]*font-size="2[02]"[^>]*fill=")[^"]*(")/g,
    '$1rgba(12,45,72,0.96)$2',
  )

  return out
}

function buildMeasureContent() {
  return `${LC_DEFS}\n${LC_MEASURE_BODY}`
}

function transformContent(key, content) {
  if (!content || !content.trim()) return content

  // 纯色几何符号
  if (!content.includes('<') && !content.includes('>')) {
    return GEOMETRY_COLOR
  }

  let out = remapIds(replaceDefs(content))

  if (key === 'measure') {
    return buildMeasureContent()
  }

  // 谱号装饰：替换 cosmos 星点
  if (COSMOS_CLEF_SPARKLE_RE.test(out)) {
    out = out.replace(COSMOS_CLEF_SPARKLE_RE, LC_CLEF_SPARKLE)
  }

  // 文本符号：简谱数字 / 拍号 / 反复
  out = out.replace(
    /fill="url\(#lcFill\)"(?=[^>]*font-size)/g,
    'fill="url(#lcDigit)"',
  )
  out = out.replace(
    /stroke="url\(#lcStroke\)"/g,
    (match, offset, str) => {
      const slice = str.slice(Math.max(0, offset - 120), offset + 80)
      return /font-size/.test(slice) ? 'stroke="rgba(29,78,111,0.75)"' : match
    },
  )

  // 移除 cosmos 星云/星芒装饰（measure 已重写；其余符号内若有残留）
  out = out.replace(/<ellipse cx="calc\(node\.w\*0\.3\)" cy="19"[\s\S]*?<\/ellipse>/g, '')
  out = out.replace(/<g>\s*<circle cx="calc\(node\.w\*0\.08\)"[\s\S]*?<\/g>\s*(?=<line|<path|$)/g, '')
  out = out.replace(/<path d="M calc\(node\.w\*0\.5\),2\.5 l0\.6,2[\s\S]*?\/>/g, '')

  out = applyTimeSignatureStyle(key, out)
  return applyTextTheme(out)
}

function transformPack(pack) {
  const out = {}
  for (const [key, item] of Object.entries(pack)) {
    out[key] = {
      ...item,
      content: transformContent(key, item.content),
    }
  }
  return out
}

const cosmos = JSON.parse(fs.readFileSync(path.join(skinsDir, 'cosmos.json'), 'utf8'))

const glacier = {
  standardStaff: transformPack(cosmos.standardStaff),
  numberNotation: transformPack(cosmos.numberNotation),
}

// slur / volta / noteBeam
for (const sec of ['standardStaff', 'numberNotation']) {
  for (const k of ['slur', 'volta', 'noteBeam']) {
    if (glacier[sec]?.[k]) glacier[sec][k].content = GEOMETRY_COLOR
  }
}

// 与 default 对齐的 number_X 偏移
if (glacier.numberNotation?.number_X) {
  glacier.numberNotation.number_X.content = glacier.numberNotation.number_X.content
    .replace(/translate\(-3\.3301, -1\.7500\)/, 'translate(-3, -1.7500)')
    .replace(/translate\(-1\.6602, -1\.7500\)/, 'translate(-3, -1.7500)')
}

const outPath = path.join(skinsDir, 'glacier.json')
fs.writeFileSync(outPath, `${JSON.stringify(glacier, null, 2)}\n`)
console.log('Wrote', outPath)

let withDefs = 0
for (const sec of [glacier.standardStaff, glacier.numberNotation]) {
  for (const item of Object.values(sec)) {
    if (item.content?.includes('<defs>')) withDefs++
  }
}
console.log('symbols with defs:', withDefs)
