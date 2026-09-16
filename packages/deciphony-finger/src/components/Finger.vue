<script lang="ts" setup>
import {computed, onBeforeUnmount, reactive, ref, watch} from 'vue'
import FingerChain from './FingerChain.vue'
import {fingerParts, type FingerPart} from '../parts'
import {
  absAngleFromDelta,
  computeJointHandles,
  type JointHandle,
} from '../jointGeometry'
import {easeInOutCubic, lerp, lerpArray} from '../tween'
import type {FingerMode, FingerProps} from '../types'

const props = withDefaults(defineProps<FingerProps>(), {
  width: 1000,
  height: 1000,
  mode: 'show',
  thumbF: () => [100, 100, 0, 0],
  indexF: () => [100, 100, 0, 0, 0],
  middleF: () => [100, 100, 0, 0, 0],
  ringF: () => [100, 100, 0, 0, 0],
  littleF: () => [100, 100, 0, 0, 0],
  duration: 0.2,
  fingerSize: 20,
})

const emit = defineEmits<{
  'update:thumbF': [pose: number[]]
  'update:indexF': [pose: number[]]
  'update:middleF': [pose: number[]]
  'update:ringF': [pose: number[]]
  'update:littleF': [pose: number[]]
  change: [payload: {finger: FingerName; pose: number[]}]
}>()

type FingerName = 'thumbF' | 'indexF' | 'middleF' | 'ringF' | 'littleF'

const JOINTS: Record<FingerName, number> = {
  thumbF: 2,
  indexF: 3,
  middleF: 3,
  ringF: 3,
  littleF: 3,
}

const FINGER_NAMES: FingerName[] = ['thumbF', 'indexF', 'middleF', 'ringF', 'littleF']

/** 拇指=1 … 小指=5 */
const FINGER_ROOT_LABEL: Record<FingerName, string> = {
  thumbF: '1',
  indexF: '2',
  middleF: '3',
  ringF: '4',
  littleF: '5',
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizePose(pose: number[] | undefined, joints: number): number[] {
  const out = Array.from({length: 2 + joints}, () => 0)
  if (!pose) return out
  for (let i = 0; i < out.length && i < pose.length; i++) {
    out[i] = toNumber(pose[i], 0)
  }
  return out
}

function clonePoseMap(src: Record<FingerName, number[]>): Record<FingerName, number[]> {
  return {
    thumbF: [...src.thumbF],
    indexF: [...src.indexF],
    middleF: [...src.middleF],
    ringF: [...src.ringF],
    littleF: [...src.littleF],
  }
}

function readTarget() {
  return {
    poses: {
      thumbF: normalizePose(props.thumbF, JOINTS.thumbF),
      indexF: normalizePose(props.indexF, JOINTS.indexF),
      middleF: normalizePose(props.middleF, JOINTS.middleF),
      ringF: normalizePose(props.ringF, JOINTS.ringF),
      littleF: normalizePose(props.littleF, JOINTS.littleF),
    },
    fingerSize: Math.max(0.01, toNumber(props.fingerSize, 20)),
  }
}

const initial = readTarget()
const shown = reactive({
  poses: clonePoseMap(initial.poses),
  fingerSize: initial.fingerSize,
})

let raf = 0
let tweenFrom = {
  poses: clonePoseMap(initial.poses),
  fingerSize: initial.fingerSize,
}
let tweenTo = {
  poses: clonePoseMap(initial.poses),
  fingerSize: initial.fingerSize,
}
let tweenStart = 0
let tweenDur = 0

function applyPose(t: number) {
  for (const name of FINGER_NAMES) {
    shown.poses[name] = lerpArray(tweenFrom.poses[name], tweenTo.poses[name], t)
  }
  shown.fingerSize = lerp(tweenFrom.fingerSize, tweenTo.fingerSize, t)
}

function cancelTween() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function tick(now: number) {
  const t = tweenDur <= 0 ? 1 : Math.min(1, (now - tweenStart) / tweenDur)
  applyPose(easeInOutCubic(t))
  if (t < 1) {
    raf = requestAnimationFrame(tick)
    return
  }
  raf = 0
}

function snapToTarget() {
  cancelTween()
  const next = readTarget()
  shown.poses = clonePoseMap(next.poses)
  shown.fingerSize = next.fingerSize
}

function startTween() {
  if (props.mode === 'edit') {
    snapToTarget()
    return
  }
  const next = readTarget()
  cancelTween()
  tweenFrom = {
    poses: clonePoseMap(shown.poses),
    fingerSize: shown.fingerSize,
  }
  tweenTo = {
    poses: clonePoseMap(next.poses),
    fingerSize: next.fingerSize,
  }
  tweenDur = Math.max(0, toNumber(props.duration, 0.2)) * 1000
  if (tweenDur === 0) {
    applyPose(1)
    return
  }
  tweenStart = performance.now()
  raf = requestAnimationFrame(tick)
}

watch(
  () => [
    props.mode,
    props.thumbF?.join(),
    props.indexF?.join(),
    props.middleF?.join(),
    props.ringF?.join(),
    props.littleF?.join(),
    toNumber(props.fingerSize, 20),
  ],
  startTween,
)

onBeforeUnmount(cancelTween)

const thumbSegments = [fingerParts['thumb-1'], fingerParts['thumb-2']]
const indexSegments = [fingerParts['index-1'], fingerParts['index-2'], fingerParts['index-3']]
const middleSegments = [fingerParts['middle-1'], fingerParts['middle-2'], fingerParts['middle-3']]
const ringSegments = [fingerParts['ring-1'], fingerParts['ring-2'], fingerParts['ring-3']]
const littleSegments = [fingerParts['little-1'], fingerParts['little-2'], fingerParts['little-3']]

const SEGMENT_MAP: Record<FingerName, FingerPart[]> = {
  thumbF: thumbSegments,
  indexF: indexSegments,
  middleF: middleSegments,
  ringF: ringSegments,
  littleF: littleSegments,
}

const fingers = computed(() => {
  const size = shown.fingerSize
  return [
    {id: 'little' as const, name: 'littleF' as const, pose: shown.poses.littleF, segments: littleSegments, size},
    {id: 'ring' as const, name: 'ringF' as const, pose: shown.poses.ringF, segments: ringSegments, size},
    {id: 'middle' as const, name: 'middleF' as const, pose: shown.poses.middleF, segments: middleSegments, size},
    {id: 'index' as const, name: 'indexF' as const, pose: shown.poses.indexF, segments: indexSegments, size},
    {id: 'thumb' as const, name: 'thumbF' as const, pose: shown.poses.thumbF, segments: thumbSegments, size},
  ]
})

type EditHandle = JointHandle & {finger: FingerName}

const editHandles = computed((): EditHandle[] => {
  if (props.mode !== 'edit') return []
  const size = shown.fingerSize
  const out: EditHandle[] = []
  for (const name of FINGER_NAMES) {
    const handles = computeJointHandles(shown.poses[name], SEGMENT_MAP[name], size)
    for (const h of handles) out.push({...h, finger: name})
  }
  return out
})

const svgRef = ref<SVGSVGElement | null>(null)

type DragState =
  | {finger: FingerName; kind: 'root'}
  | {finger: FingerName; kind: 'rotate'; jointIndex: number}

const drag = ref<DragState | null>(null)

function clientToSvg(ev: PointerEvent): {x: number; y: number} {
  const svg = svgRef.value
  if (!svg) return {x: ev.clientX, y: ev.clientY}
  const pt = svg.createSVGPoint()
  pt.x = ev.clientX
  pt.y = ev.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return {x: ev.clientX, y: ev.clientY}
  const local = pt.matrixTransform(ctm.inverse())
  return {x: local.x, y: local.y}
}

function emitPose(finger: FingerName, pose: number[]) {
  const next = [...pose]
  shown.poses[finger] = next
  if (finger === 'thumbF') emit('update:thumbF', next)
  else if (finger === 'indexF') emit('update:indexF', next)
  else if (finger === 'middleF') emit('update:middleF', next)
  else if (finger === 'ringF') emit('update:ringF', next)
  else emit('update:littleF', next)
  emit('change', {finger, pose: next})
}

function onHandlePointerDown(ev: PointerEvent, handle: EditHandle) {
  if (props.mode !== 'edit') return
  ev.preventDefault()
  ev.stopPropagation()
  ;(ev.currentTarget as Element).setPointerCapture(ev.pointerId)
  if (handle.kind === 'root') {
    drag.value = {finger: handle.finger, kind: 'root'}
  } else {
    drag.value = {finger: handle.finger, kind: 'rotate', jointIndex: handle.index}
  }
}

function onHandlePointerMove(ev: PointerEvent) {
  const state = drag.value
  if (!state) return
  const {x, y} = clientToSvg(ev)
  const pose = [...shown.poses[state.finger]]
  if (state.kind === 'root') {
    pose[0] = x
    pose[1] = y
    emitPose(state.finger, pose)
    return
  }

  // 旋转：改 angles[jointIndex - 1]，使该段指向指针
  const jointIndex = state.jointIndex
  const segments = SEGMENT_MAP[state.finger]
  const size = shown.fingerSize
  const parentHandles = computeJointHandles(pose, segments, size)
  const parent = parentHandles[jointIndex - 1]
  if (!parent) return

  const absWanted = absAngleFromDelta(x - parent.x, y - parent.y)
  let parentAbs = 0
  for (let i = 0; i < jointIndex - 1; i++) parentAbs += pose[2 + i] ?? 0
  pose[2 + (jointIndex - 1)] = absWanted - parentAbs
  emitPose(state.finger, pose)
}

function onHandlePointerUp(ev: PointerEvent) {
  if (!drag.value) return
  try {
    ;(ev.currentTarget as Element).releasePointerCapture(ev.pointerId)
  } catch {
    /* noop */
  }
  drag.value = null
}

const isEdit = computed(() => props.mode === 'edit')
</script>

<template>
  <svg
    ref="svgRef"
    class="deciphony-finger"
    :class="{'deciphony-finger--edit': isEdit}"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    overflow="visible"
    xmlns="http://www.w3.org/2000/svg"
  >
    <FingerChain
      v-for="finger in fingers"
      :key="finger.id"
      :x="finger.pose[0] ?? 0"
      :y="finger.pose[1] ?? 0"
      :size="finger.size"
      :angles="finger.pose.slice(2)"
      :segments="finger.segments"
    />

    <g v-if="isEdit" class="deciphony-finger__handles">
      <g
        v-for="(h, i) in editHandles"
        :key="`${h.finger}-${h.index}-${i}`"
        class="deciphony-finger__handle-wrap"
        @pointerdown="onHandlePointerDown($event, h)"
        @pointermove="onHandlePointerMove"
        @pointerup="onHandlePointerUp"
        @pointercancel="onHandlePointerUp"
      >
        <circle
          class="deciphony-finger__handle"
          :class="
            h.kind === 'root'
              ? 'deciphony-finger__handle--root'
              : 'deciphony-finger__handle--rotate'
          "
          :cx="h.x"
          :cy="h.y"
          r="8"
        />
        <text
          v-if="h.kind === 'root'"
          class="deciphony-finger__handle-label"
          :x="h.x"
          :y="h.y"
          dominant-baseline="central"
          text-anchor="middle"
        >{{ FINGER_ROOT_LABEL[h.finger] }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.deciphony-finger--edit {
  touch-action: none;
}

.deciphony-finger__handle-wrap {
  cursor: grab;
  pointer-events: all;
}

.deciphony-finger__handle-wrap:active {
  cursor: grabbing;
}

.deciphony-finger__handle {
  stroke: #fff;
  stroke-width: 1.5;
  pointer-events: all;
}

.deciphony-finger__handle--root {
  fill: #2563eb;
}

.deciphony-finger__handle--rotate {
  fill: #ea580c;
}

.deciphony-finger__handle-label {
  fill: #fff;
  font-size: 11px;
  font-weight: 700;
  font-family: system-ui, sans-serif;
  pointer-events: none;
  user-select: none;
}
</style>
