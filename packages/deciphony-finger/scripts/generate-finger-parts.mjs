/**
 * 生成 14 张手指关节 SVG：默认朝左，枢轴在 (0,0)，骨段沿 -X。
 * 单位：大拇指宽度 x = 1。
 *
 * 关节衔接约定：父件末端半径 r1 == 子件根部半径 r0，且两者圆心重合于子件枢轴，
 * 因此任意弯曲角度下轮廓都吻合。描边只画手指两侧，端部圆弧一律不描边。
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../src/parts')

/** @typedef {{ id: string, finger: string, joint: number, length: number, width: number, role: 'proximal' | 'middle' | 'distal', r0Scale: number, r1Scale: number }} PartDef */

/** @type {PartDef[]} */
const PARTS = [
  {id: 'thumb-1', finger: 'thumb', joint: 1, length: 2, width: 1, role: 'proximal', r0Scale: 1, r1Scale: 0.94},
  {id: 'thumb-2', finger: 'thumb', joint: 2, length: 1.75, width: 1, role: 'distal', r0Scale: 0.94, r1Scale: 0.84},
  {id: 'index-1', finger: 'index', joint: 1, length: 2, width: 0.8, role: 'proximal', r0Scale: 1, r1Scale: 0.94},
  {id: 'index-2', finger: 'index', joint: 2, length: 2, width: 0.8, role: 'middle', r0Scale: 0.94, r1Scale: 0.88},
  {id: 'index-3', finger: 'index', joint: 3, length: 1.5, width: 0.8, role: 'distal', r0Scale: 0.88, r1Scale: 0.82},
  {id: 'middle-1', finger: 'middle', joint: 1, length: 2.25, width: 0.8, role: 'proximal', r0Scale: 1, r1Scale: 0.94},
  {id: 'middle-2', finger: 'middle', joint: 2, length: 2, width: 0.8, role: 'middle', r0Scale: 0.94, r1Scale: 0.88},
  {id: 'middle-3', finger: 'middle', joint: 3, length: 1.5, width: 0.8, role: 'distal', r0Scale: 0.88, r1Scale: 0.82},
  {id: 'ring-1', finger: 'ring', joint: 1, length: 2, width: 0.7, role: 'proximal', r0Scale: 1, r1Scale: 0.94},
  {id: 'ring-2', finger: 'ring', joint: 2, length: 2, width: 0.7, role: 'middle', r0Scale: 0.94, r1Scale: 0.88},
  {id: 'ring-3', finger: 'ring', joint: 3, length: 1.5, width: 0.7, role: 'distal', r0Scale: 0.88, r1Scale: 0.82},
  {id: 'little-1', finger: 'little', joint: 1, length: 1.75, width: 0.65, role: 'proximal', r0Scale: 1, r1Scale: 0.94},
  {id: 'little-2', finger: 'little', joint: 2, length: 1.75, width: 0.65, role: 'middle', r0Scale: 0.94, r1Scale: 0.88},
  {id: 'little-3', finger: 'little', joint: 3, length: 1.5, width: 0.65, role: 'distal', r0Scale: 0.88, r1Scale: 0.82},
]

function round(n, d = 4) {
  const p = 10 ** d
  return Math.round(n * p) / p
}

function boneRadii(part) {
  const half = part.width / 2
  return {r0: half * part.r0Scale, r1: half * part.r1Scale}
}

/** 指端凸出量：尾关节略扁，其余保持正圆以便与子件根部同心。 */
function tipBulge(part, r1) {
  return part.role === 'distal' ? r1 * 0.88 : r1
}

function viewBoxOf(part) {
  const {r0, r1} = boneRadii(part)
  const pad = Math.max(part.width * 0.08, 0.05)
  const minX = -part.length - tipBulge(part, r1) - pad
  const maxX = r0 + pad
  const maxY = Math.max(r0, r1) + pad
  return {
    x: round(minX),
    y: round(-maxY),
    w: round(maxX - minX),
    h: round(maxY * 2),
  }
}

/** 闭合外形：上侧 → 指端弧 → 下侧 → 根部半圆。 */
function bodyPath(part, r0, r1) {
  const L = part.length
  const bulge = tipBulge(part, r1)
  return [
    `M 0 ${round(-r0)}`,
    `L ${round(-L)} ${round(-r1)}`,
    `A ${round(bulge)} ${round(r1)} 0 0 0 ${round(-L)} ${round(r1)}`,
    `L 0 ${round(r0)}`,
    `A ${round(r0)} ${round(r0)} 0 0 0 0 ${round(-r0)}`,
    'Z',
  ].join(' ')
}

/** 只描两侧：尾关节把指端弧连进同一笔，其余关节两端留空。 */
function outlinePaths(part, r0, r1) {
  const L = part.length
  if (part.role === 'distal') {
    return [
      [
        `M 0 ${round(-r0)}`,
        `L ${round(-L)} ${round(-r1)}`,
        `A ${round(tipBulge(part, r1))} ${round(r1)} 0 0 0 ${round(-L)} ${round(r1)}`,
        `L 0 ${round(r0)}`,
      ].join(' '),
    ]
  }
  return [
    `M 0 ${round(-r0)} L ${round(-L)} ${round(-r1)}`,
    `M 0 ${round(r0)} L ${round(-L)} ${round(r1)}`,
  ]
}

/** 指节褶皱：靠近根部的两道极淡短弧。 */
function creasePath(part, r0, r1) {
  const x = -part.length * 0.16
  const r = r0 + ((r1 - r0) * 0.16)
  const bend = part.width * 0.07
  return [
    `M ${round(x)} ${round(-r * 0.72)}`,
    `Q ${round(x - bend)} 0 ${round(x)} ${round(r * 0.72)}`,
    `M ${round(x - r * 0.16)} ${round(-r * 0.54)}`,
    `Q ${round(x - bend - r * 0.16)} 0 ${round(x - r * 0.16)} ${round(r * 0.54)}`,
  ].join(' ')
}

function renderSvg(part) {
  const {r0, r1} = boneRadii(part)
  const L = part.length
  const vb = viewBoxOf(part)
  const gid = part.id.replace(/-/g, '')
  const stroke = round(Math.max(part.width * 0.036, 0.024))
  const body = bodyPath(part, r0, r1)
  const isTip = part.role === 'distal'
  const rMin = Math.min(r0, r1)

  const nailRx = Math.min(L * 0.28, r1 * 1.15)
  const nailRy = r1 * 0.58
  const nailCx = -L + nailRx * 0.62
  const nailCy = -r1 * 0.14

  const inner = [
    `      <ellipse class="shine" cx="${round(-L * 0.46)}" cy="${round(-rMin * 0.52)}" rx="${round(L * 0.36)}" ry="${round(rMin * 0.16)}"/>`,
    isTip ? '' : `      <path class="crease" d="${creasePath(part, r0, r1)}"/>`,
    isTip
      ? `      <ellipse class="nail" cx="${round(nailCx)}" cy="${round(nailCy)}" rx="${round(nailRx)}" ry="${round(nailRy)}"/>
      <ellipse class="nail-shine" cx="${round(nailCx - nailRx * 0.24)}" cy="${round(nailCy - nailRy * 0.34)}" rx="${round(nailRx * 0.32)}" ry="${round(nailRy * 0.2)}"/>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const outline = outlinePaths(part, r0, r1)
    .map((d) => `    <path class="edge" d="${d}"/>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" fill="none">
  <defs>
    <linearGradient id="skin-${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7d8c1"/>
      <stop offset="26%" stop-color="#f1c7a6"/>
      <stop offset="62%" stop-color="#e6ae87"/>
      <stop offset="100%" stop-color="#cf8d63"/>
    </linearGradient>
    <linearGradient id="edge-${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${round(-L * 0.22)}" y2="0">
      <stop offset="0%" stop-color="#c07f56" stop-opacity="0"/>
      <stop offset="100%" stop-color="#c07f56" stop-opacity="1"/>
    </linearGradient>
    <clipPath id="clip-${gid}">
      <path d="${body}"/>
    </clipPath>
  </defs>
  <g class="part" data-part="${part.id}" data-facing="left">
    <path class="skin" d="${body}"/>
    <g clip-path="url(#clip-${gid})">
${inner}
    </g>
${outline}
  </g>
  <style>
    .skin { fill: url(#skin-${gid}); }
    .shine { fill: #fff6ee; opacity: 0.26; }
    .crease { fill: none; stroke: #c4835f; stroke-width: ${round(stroke * 0.85)}; stroke-linecap: round; opacity: 0.42; }
    .edge { fill: none; stroke: url(#edge-${gid}); stroke-width: ${stroke}; stroke-linecap: butt; opacity: 0.9; }
    .nail { fill: #fbe9e0; stroke: #d3a08a; stroke-width: ${round(stroke * 0.7)}; opacity: 0.95; }
    .nail-shine { fill: #fff; opacity: 0.45; }
  </style>
</svg>
`
}

fs.mkdirSync(outDir, {recursive: true})

const metaLines = [
  '/** Auto-generated by scripts/generate-finger-parts.mjs — do not edit by hand. */',
  '',
  'export type FingerPartId =',
  ...PARTS.map((p) => `  | '${p.id}'`),
  '',
  "export type FingerPartRole = 'proximal' | 'middle' | 'distal'",
  '',
  'export interface FingerPartDef {',
  '  id: FingerPartId',
  "  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'little'",
  '  joint: number',
  '  length: number',
  '  width: number',
  '  role: FingerPartRole',
  '  viewBox: {x: number; y: number; w: number; h: number}',
  '}',
  '',
  'export const FINGER_PART_DEFS: FingerPartDef[] = [',
]

for (const part of PARTS) {
  fs.writeFileSync(path.join(outDir, `${part.id}.svg`), renderSvg(part))
  const vb = viewBoxOf(part)
  metaLines.push(
    `  {id: '${part.id}', finger: '${part.finger}', joint: ${part.joint}, length: ${part.length}, width: ${part.width}, role: '${part.role}', viewBox: {x: ${vb.x}, y: ${vb.y}, w: ${vb.w}, h: ${vb.h}}},`,
  )
}

metaLines.push(']', '')
fs.writeFileSync(path.join(outDir, 'meta.ts'), metaLines.join('\n'))

console.log(`wrote ${PARTS.length} svg parts + meta.ts → ${outDir}`)
