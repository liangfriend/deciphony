<script setup lang="ts">
import {computed} from 'vue'
import type {PropType} from 'vue'
import {NoteName} from '@/enums/musicScoreEnum'
import type {Barre, StringState, tabChord} from '@/types/MusicScoreType'

const props = defineProps({
  /** 传入完整 tabChord 时优先使用 */
  chord: {
    type: Object as PropType<tabChord>,
    default: undefined,
  },
  /** 框体宽高（不含 name / tuning / 空闷音等文字），默认 50×60 */
  width: {type: Number, default: 50},
  height: {type: Number, default: 60},
  /** 除 name 外文字字号，默认 10 */
  textSize: {type: Number, default: 10},
  /** 和弦名字号，默认 32 */
  nameSize: {type: Number, default: 32},
  stringCount: {type: Number, default: 6},
  name: {type: String, default: ''},
  fretCount: {type: Number, default: 5},
  baseFret: {type: Number, default: 0},
  barres: {type: Array as PropType<Barre[]>, default: () => []},
  tuning: {
    type: Array as PropType<NoteName[]>,
    default: () => ['E', 'A', 'D', 'G', 'B', 'E'] as NoteName[],
  },
  /** 索引 0=1弦(右)，与 tabChord.stringStates 一致 */
  stringStates: {type: Array as PropType<StringState[]>, default: () => []},
  /** 线条与文字颜色，曲谱渲染时来自皮肤 */
  color: {type: String, default: '#111'},
})

const cfg = computed(() => ({
  width: props.chord?.width ?? props.width,
  height: props.chord?.height ?? props.height,
  textSize: props.chord?.textSize ?? props.textSize,
  nameSize: props.chord?.nameSize ?? props.nameSize,
  stringCount: props.chord?.stringCount ?? props.stringCount,
  name: props.chord?.name ?? props.name,
  fretCount: props.chord?.fretCount ?? props.fretCount,
  baseFret: props.chord?.baseFret ?? props.baseFret,
  barres: props.chord?.barres ?? props.barres,
  tuning: props.chord?.tuning ?? props.tuning,
  stringStates: props.chord?.stringStates ?? props.stringStates,
}))

/** stringStates 索引 0=1弦 → 视觉列左6右1 */
function stringToCol(stringIndex: number, stringCount: number): number {
  return stringCount - 1 - stringIndex
}

function stringSpacing(gridW: number, stringCount: number): number {
  if (stringCount <= 1) return gridW
  return gridW / (stringCount - 1)
}

/** 弦的 x：按弦线位置（非格子中心） */
function stringX(col: number, gridX: number, gridW: number, stringCount: number): number {
  if (stringCount <= 1) return gridX + gridW / 2
  return gridX + col * stringSpacing(gridW, stringCount)
}

type Layout = {
  w: number
  h: number
  gridX: number
  gridY: number
  gridW: number
  gridH: number
  cellH: number
  stringSpacing: number
  dotRadius: number
}

/** baseFret 数字与框体左缘的水平间距（× textSize） */
const BASE_FRET_FRAME_GAP = 0.75

const layout = computed((): Layout => {
  const {width: w, height: h, stringCount, fretCount, textSize} = cfg.value
  const gridX = 0
  const gridY = 0
  const gridW = w
  const gridH = h
  const spacing = stringSpacing(gridW, stringCount)
  const cellH = gridH / fretCount
  const dotRadius = Math.max(textSize * 0.55, Math.min(spacing, cellH) * 0.32)
  return {
    w,
    h,
    gridX,
    gridY,
    gridW,
    gridH,
    cellH,
    stringSpacing: spacing,
    dotRadius,
  }
})

function fretCenterY(relativeFret: number, baseFret: number, ly: Layout): number {
  return ly.gridY + (relativeFret + 0.5) * ly.cellH
}

/** O/X 与框体顶部的间距（× textSize） */
const MARKER_FRAME_GAP = 0.95
/** name 与 O/X 行的间距（× nameSize） */
const NAME_MARKER_GAP = 0.1

const markerY = computed(() => {
  const ts = cfg.value.textSize
  return -(ts * 0.5 + ts * MARKER_FRAME_GAP)
})

const nameY = computed(() => {
  const ns = cfg.value.nameSize
  const ts = cfg.value.textSize
  const markerTop = markerY.value - ts * 0.5
  return markerTop - ns * NAME_MARKER_GAP - ns * 0.5
})

const tuningY = computed(() => layout.value.gridH + cfg.value.textSize * 0.75)

const fretLines = computed(() => {
  const ly = layout.value
  const lines: Array<{ y: number; thick?: boolean }> = []
  for (let i = 0; i <= cfg.value.fretCount; i++) {
    lines.push({
      y: ly.gridY + i * ly.cellH,
      thick: cfg.value.baseFret === 0 && i === 0,
    })
  }
  return lines
})

const stringLines = computed(() => {
  const ly = layout.value
  const {stringCount} = cfg.value
  return Array.from({length: stringCount}, (_, col) => ({
    x: stringX(col, ly.gridX, ly.gridW, stringCount),
  }))
})

type DotMarker = { kind: 'dot'; x: number; y: number; label: string }
type TextMarker = { kind: 'open' | 'mute'; x: number; y: number }

const markers = computed((): Array<DotMarker | TextMarker> => {
  const ly = layout.value
  const {stringStates, stringCount} = cfg.value
  const out: Array<DotMarker | TextMarker> = []
  for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) {
    const state = stringStates[stringIndex]
    if (!state) continue
    const col = stringToCol(stringIndex, stringCount)
    const x = stringX(col, ly.gridX, ly.gridW, stringCount)
    const finger = state.finger
    if (finger === 'o') {
      out.push({kind: 'open', x, y: markerY.value})
      continue
    }
    if (finger === 'x') {
      out.push({kind: 'mute', x, y: markerY.value})
      continue
    }
    if (finger === -1) {
      continue
    }
    if (typeof finger === 'number' && finger >= 0) {
      out.push({
        kind: 'dot',
        x,
        y: fretCenterY(finger, cfg.value.baseFret, ly),
        label: state.text ?? '',
      })
    }
  }
  return out
})

type BarreCapsule = {
  kind: 'capsule'
  x1: number
  x2: number
  y: number
  r: number
  labels: Array<{ x: number; y: number; text: string }>
}
type BarreDot = { kind: 'dot'; x: number; y: number; r: number; label: string }
type BarreDraw = BarreCapsule | BarreDot

function clampStringIndex(n: number, stringCount: number): number {
  if (stringCount <= 0) return 0
  return Math.min(Math.max(n, 0), stringCount - 1)
}

function resolveBarreStringRange(
    startStringNumber: number,
    endStringNumber: number,
    stringCount: number,
): { start: number; end: number } | null {
  if (stringCount <= 0) return null
  const start = clampStringIndex(startStringNumber, stringCount)
  const end = clampStringIndex(endStringNumber, stringCount)
  if (start > end) return null
  return {start, end}
}

const barreBars = computed((): BarreDraw[] => {
  const ly = layout.value
  const {barres, stringCount} = cfg.value
  const out: BarreDraw[] = []
  for (const barre of barres) {
    const range = resolveBarreStringRange(
        barre.startStringNumber,
        barre.endStringNumber,
        stringCount,
    )
    if (!range) continue
    const {start, end} = range
    const y = fretCenterY(barre.fret, cfg.value.baseFret, ly)
    const r = ly.dotRadius

    if (start === end) {
      const x = stringX(stringToCol(start, stringCount), ly.gridX, ly.gridW, stringCount)
      out.push({
        kind: 'dot',
        x,
        y,
        r,
        label: barre.text[start] ?? '',
      })
      continue
    }

    const minCol = stringToCol(end, stringCount)
    const maxCol = stringToCol(start, stringCount)
    const x1 = stringX(minCol, ly.gridX, ly.gridW, stringCount)
    const x2 = stringX(maxCol, ly.gridX, ly.gridW, stringCount)
    const labels: BarreCapsule['labels'] = []
    for (let stringIndex = start; stringIndex <= end; stringIndex++) {
      const label = barre.text[stringIndex]
      if (!label) continue
      labels.push({
        x: stringX(stringToCol(stringIndex, stringCount), ly.gridX, ly.gridW, stringCount),
        y,
        text: label,
      })
    }
    out.push({
      kind: 'capsule',
      x1,
      x2,
      y,
      r,
      labels,
    })
  }
  return out
})

const tuningLabels = computed(() => {
  const ly = layout.value
  const {tuning, stringCount} = cfg.value
  if (!tuning?.length) return []
  return Array.from({length: stringCount}, (_, col) => {
    const stringIndex = stringCount - 1 - col
    return {
      x: stringX(col, ly.gridX, ly.gridW, stringCount),
      y: tuningY.value,
      text: tuning[stringIndex] ?? '',
    }
  })
})

const lyGridCenterX = computed(() => layout.value.gridW / 2)

/** baseFret 标注：框体左侧外，第一品行垂直居中 */
const baseFretLabel = computed(() => {
  if (cfg.value.baseFret <= 0) return null
  const ly = layout.value
  const ts = cfg.value.textSize
  return {
    x: -ts * BASE_FRET_FRAME_GAP,
    y: ly.gridY + ly.cellH * 0.5,
    text: String(cfg.value.baseFret),
  }
})
</script>

<template>
  <g role="img" aria-label="和弦图">
      <text
          v-if="cfg.name"
          :x="lyGridCenterX"
          :y="nameY"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="cfg.nameSize"
          font-weight="600"
          :fill="color"
      >{{ cfg.name }}
      </text>

      <text
          v-if="baseFretLabel"
          :x="baseFretLabel.x"
          :y="baseFretLabel.y"
          text-anchor="end"
          dominant-baseline="central"
          :font-size="cfg.textSize"
          :fill="color"
      >{{ baseFretLabel.text }}
      </text>

      <line
          v-for="(s, i) in stringLines"
          :key="'s' + i"
          :x1="s.x"
          :y1="layout.gridY"
          :x2="s.x"
          :y2="layout.gridY + layout.gridH"
          :stroke="color"
          stroke-width="1"
      />

      <line
          v-for="(f, i) in fretLines"
          :key="'f' + i"
          :x1="layout.gridX-0.5"
          :y1="f.y"
          :x2="layout.gridX + layout.gridW+0.5"
          :y2="f.y"
          :stroke="color"
          :stroke-width="f.thick ? 2.5 : 1"
      />

      <template v-for="(b, i) in barreBars" :key="'b' + i">
        <line
            v-if="b.kind === 'capsule'"
            :x1="b.x1"
            :y1="b.y"
            :x2="b.x2"
            :y2="b.y"
            :stroke-width="b.r * 2"
            stroke-linecap="round"
            :stroke="color"
        />
        <g v-else-if="b.kind === 'dot'">
          <circle :cx="b.x" :cy="b.y" :r="b.r" :fill="color"/>
          <text
              v-if="b.label"
              :x="b.x"
              :y="b.y"
              text-anchor="middle"
              dominant-baseline="central"
              :font-size="cfg.textSize"
              fill="#fff"
          >{{ b.label }}
          </text>
        </g>
        <text
            v-for="(lb, li) in b.kind === 'capsule' ? b.labels : []"
            :key="'bl' + i + '-' + li"
            :x="lb.x"
            :y="lb.y"
            text-anchor="middle"
            dominant-baseline="central"
            :font-size="cfg.textSize"
            fill="#fff"
        >{{ lb.text }}
        </text>
      </template>

      <template v-for="(m, i) in markers" :key="'m' + i">
        <text
            v-if="m.kind === 'open'"
            :x="m.x"
            :y="m.y"
            text-anchor="middle"
            dominant-baseline="central"
            :font-size="cfg.textSize"
            :fill="color"
        >O
        </text>
        <text
            v-else-if="m.kind === 'mute'"
            :x="m.x"
            :y="m.y"
            text-anchor="middle"
            dominant-baseline="central"
            :font-size="cfg.textSize"
            :fill="color"
        >X
        </text>
        <g v-else-if="m.kind === 'dot'">
          <circle :cx="m.x" :cy="m.y" :r="layout.dotRadius" :fill="color"/>
          <text
              v-if="m.label"
              :x="m.x"
              :y="m.y"
              text-anchor="middle"
              dominant-baseline="central"
              :font-size="cfg.textSize"
              fill="#fff"
          >{{ m.label }}
          </text>
        </g>
      </template>

      <text
          v-for="(t, i) in tuningLabels"
          :key="'t' + i"
          :x="t.x"
          :y="t.y"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="cfg.textSize"
          :fill="color"
          opacity="0.75"
      >{{ t.text }}
      </text>
  </g>
</template>
