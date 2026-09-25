import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * 大写 T / A / B 竖排，设计框 18 × 54：
 *   T：y 0 ~ 16.5   A：y 19 ~ 35   B：y 38 ~ 54
 * 顶边 y=0、底边 y=54 与谱表边对齐；渲染时按 node.w / node.h 缩放铺满。
 */
const CONTENT = [
  '<g transform="scale(calc(node.w/18), calc(node.h/54))">',
  // T：横杠贴顶 + 竖杠
  '  <rect x="2" y="0" width="14" height="2.6" fill="black"/>',
  '  <rect x="7.7" y="0" width="2.6" height="16.5" fill="black"/>',
  // A：平顶双腿 + 横杠
  '  <path d="M6.9 19 H11.1 L16.5 35 H13.6 L9 22.6 L4.4 35 H1.5 Z" fill="black"/>',
  '  <rect x="5.4" y="29.6" width="7.2" height="2.4" fill="black"/>',
  // B：竖杠 + 上下两个半圆
  '  <rect x="3" y="38" width="2.6" height="16" fill="black"/>',
  '  <path d="M4.3 39.3 H9.5 A3.35 3.35 0 0 1 9.5 46 H4.3 M4.3 46 H10.3 A3.35 3.35 0 0 1 10.3 52.7 H4.3"',
  '        fill="none" stroke="black" stroke-width="2.6" stroke-linecap="butt" stroke-linejoin="miter"/>',
  '</g>',
].join('\n')

function makeItem(h, key) {
  return {
    content: CONTENT,
    w: 18,
    h,
    skinKey: key,
    widthRatio: 12,
    widthRatioForMeasure: 14,
  }
}

function injectPack(pack, h) {
  if (!pack || typeof pack !== 'object') return pack
  const next = {}
  for (const [k, v] of Object.entries(pack)) {
    if (k === 'tab' || k === 'tab_f') continue
    next[k] = v
    if (k === 'measure') {
      next.tab = makeItem(h, 'tab')
      next.tab_f = makeItem(h, 'tab_f')
    }
  }
  if (!next.tab) {
    next.tab = makeItem(h, 'tab')
    next.tab_f = makeItem(h, 'tab_f')
  }
  return next
}

const files = [
  path.join(root, '../src/skins/default.json'),
  path.join(root, '../../deciphony-test/src/views/skins/default.json'),
]

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'))
  data.tab6 = injectPack(data.tab6, data.tab6?.measure?.h ?? 56)
  data.tab4 = injectPack(data.tab4, data.tab4?.measure?.h ?? 34)
  fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(
    'updated',
    path.basename(path.dirname(f)) + '/' + path.basename(f),
    'tab6.h=',
    data.tab6?.tab?.h,
    'tab4.h=',
    data.tab4?.tab?.h,
    'keys',
    Object.keys(data.tab6).length,
  )
}
