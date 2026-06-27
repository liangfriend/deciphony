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
  width: {type: Number, default: 60},
  height: {type: Number, default: 72},
  stringCount: {type: Number, default: 6},
  name: {type: String, default: ''},
  fretCount: {type: Number, default: 4},
  baseFret: {type: Number, default: 0},
  barres: {type: Array as PropType<Barre[]>, default: () => []},
  tuning: {
    type: Array as PropType<NoteName[]>,
    default: () => ['E', 'A', 'D', 'G', 'B', 'E'] as NoteName[],
  },
  /** 索引 0=1弦(右)，与 tabChord.stringStates 一致 */
  stringStates: {type: Array as PropType<StringState[]>, default: () => []},
})

const cfg = computed(() => ({
  width: props.chord?.width ?? props.width,
  height: props.chord?.height ?? props.height,
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

function stringX(col: number, layout: Layout): number {
  return layout.gridX + (col + 0.5) * layout.cellW
}

type Layout = {
  w: number
  h: number
  gridX: number
  gridY: number
  gridW: number
  gridH: number
  cellW: number
  cellH: number
}

const layout = computed((): Layout => {
  const {width: w, height: h, stringCount, fretCount} = cfg.value
  const gridX = cfg.value.baseFret > 0 ? 14 : 8
  const gridY = 16
  const gridW = w - gridX - 6
  const gridH = h - gridY - 8
  return {
    w,
    h,
    gridX,
    gridY,
    gridW,
    gridH,
    cellW: gridW / stringCount,
    cellH: gridH / fretCount,
  }
})

function fretCenterY(absFret: number, baseFret: number, ly: Layout): number {
  return ly.gridY + (absFret - baseFret - 0.5) * ly.cellH
}

/** stringStates.finger 为相对品：0 = 第 (baseFret+1) 品 */
function relativeFretToAbs(relative: number, baseFret: number): number {
  return baseFret + relative + 1
}

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
    x: ly.gridX + col * ly.cellW,
  }))
})

type DotMarker = { kind: 'dot'; x: number; y: number; label: string }
type TextMarker = { kind: 'open' | 'mute'; x: number; y: number }

const markers = computed((): Array<DotMarker | TextMarker> => {
  const ly = layout.value
  const {stringStates, stringCount, baseFret} = cfg.value
  const out: Array<DotMarker | TextMarker> = []
  for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) {
    const state = stringStates[stringIndex]
    if (!state) continue
    const col = stringToCol(stringIndex, stringCount)
    const x = stringX(col, ly)
    const finger = state.finger
    if (finger === 'o') {
      out.push({kind: 'open', x, y: ly.gridY - 4})
      continue
    }
    if (finger === 'x') {
      out.push({kind: 'mute', x, y: ly.gridY - 4})
      continue
    }
    if (finger === -1) {
      continue
    }
    if (typeof finger === 'number' && finger >= 0) {
      out.push({
        kind: 'dot',
        x,
        y: fretCenterY(relativeFretToAbs(finger, baseFret), baseFret, ly),
        label: state.text ?? '',
      })
    }
  }
  return out
})

type BarreDraw = { x1: number; x2: number; y: number; labels: Array<{ x: number; y: number; text: string }> }

/** 弦索引 clamp 到 [0, stringCount - 1] */
function clampStringIndex(n: number, stringCount: number): number {
  if (stringCount <= 0) return 0
  return Math.min(Math.max(n, 0), stringCount - 1)
}

/**
 * 横按范围 [start, end]（含）；start=细弦，end=粗弦。
 * start > end 视为无效；索引 clamp 到 [0, stringCount - 1]。
 */
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
  const {barres, stringCount, baseFret} = cfg.value
  const out: BarreDraw[] = []
  for (const barre of barres) {
    const range = resolveBarreStringRange(
      barre.startStringNumber,
      barre.endStringNumber,
      stringCount,
    )
    if (!range) continue
    const {start, end} = range
    const minCol = stringToCol(end, stringCount)
    const maxCol = stringToCol(start, stringCount)
    const pad = ly.cellW * 0.22
    const y = fretCenterY(relativeFretToAbs(barre.fret, baseFret), baseFret, ly)
    const labels: BarreDraw['labels'] = []
    for (let stringIndex = start; stringIndex <= end; stringIndex++) {
      const label = barre.text[stringIndex]
      if (!label) continue
      labels.push({
        x: stringX(stringToCol(stringIndex, stringCount), ly),
        y,
        text: label,
      })
    }
    out.push({
      x1: ly.gridX + minCol * ly.cellW + pad,
      x2: ly.gridX + (maxCol + 1) * ly.cellW - pad,
      y,
      labels,
    })
  }
  return out
})

const barreLabels = computed(() =>
  barreBars.value.flatMap((b, bi) =>
    b.labels.map((l, li) => ({...l, key: `${bi}-${li}`})),
  ),
)

const tuningLabels = computed(() => {
  const ly = layout.value
  const {tuning, stringCount} = cfg.value
  if (!tuning?.length) return []
  return Array.from({length: stringCount}, (_, col) => {
    const stringIndex = stringCount - 1 - col
    return {
      x: stringX(col, ly),
      y: ly.gridY + ly.gridH + 10,
      text: tuning[stringIndex] ?? '',
    }
  })
})
</script>

<template>
  <svg
    :width="cfg.width"
    :height="cfg.height"
    :viewBox="`0 0 ${cfg.width} ${cfg.height}`"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="和弦图"
  >
    <text
      v-if="cfg.name"
      :x="cfg.width / 2"
      y="11"
      text-anchor="middle"
      font-size="11"
      font-weight="600"
      fill="#111"
    >{{ cfg.name }}</text>

    <text
      v-if="cfg.baseFret > 0"
      :x="4"
      :y="layout.gridY + layout.cellH * 0.65"
      font-size="9"
      fill="#111"
    >{{ cfg.baseFret }}</text>

    <line
      v-for="(s, i) in stringLines"
      :key="'s' + i"
      :x1="s.x"
      :y1="layout.gridY"
      :x2="s.x"
      :y2="layout.gridY + layout.gridH"
      stroke="#111"
      stroke-width="1"
    />

    <line
      v-for="(f, i) in fretLines"
      :key="'f' + i"
      :x1="layout.gridX"
      :y1="f.y"
      :x2="layout.gridX + layout.gridW"
      :y2="f.y"
      stroke="#111"
      :stroke-width="f.thick ? 2.5 : 1"
    />

    <rect
      v-for="(b, i) in barreBars"
      :key="'b' + i"
      :x="b.x1"
      :y="b.y - layout.cellH * 0.28"
      :width="b.x2 - b.x1"
      :height="layout.cellH * 0.56"
      rx="2"
      fill="#111"
    />

    <text
      v-for="lb in barreLabels"
      :key="'bl' + lb.key"
      :x="lb.x"
      :y="lb.y + 3.5"
      text-anchor="middle"
      font-size="8"
      fill="#fff"
    >{{ lb.text }}</text>

    <template v-for="(m, i) in markers" :key="'m' + i">
      <text
        v-if="m.kind === 'open'"
        :x="m.x"
        :y="m.y"
        text-anchor="middle"
        font-size="9"
        fill="#111"
      >O</text>
      <text
        v-else-if="m.kind === 'mute'"
        :x="m.x"
        :y="m.y"
        text-anchor="middle"
        font-size="9"
        fill="#111"
      >X</text>
      <g v-else-if="m.kind === 'dot'">
        <circle :cx="m.x" :cy="m.y" :r="layout.cellW * 0.28" fill="#111" />
        <text
          v-if="m.label"
          :x="m.x"
          :y="m.y + 3.5"
          text-anchor="middle"
          font-size="8"
          fill="#fff"
        >{{ m.label }}</text>
      </g>
    </template>

    <text
      v-for="(t, i) in tuningLabels"
      :key="'t' + i"
      :x="t.x"
      :y="t.y"
      text-anchor="middle"
      font-size="7"
      fill="#111"
      opacity="0.75"
    >{{ t.text }}</text>
  </svg>
</template>

<style scoped>
svg {
  display: block;
}
</style>
