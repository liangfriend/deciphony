<script lang="ts" setup>
import {computed, onBeforeUnmount, reactive, watch} from 'vue'
import FingerChain from './FingerChain.vue'
import {fingerParts} from '../parts'
import {easeInOutCubic, lerp, lerpArray} from '../tween'
import type {FingerProps} from '../types'

const props = withDefaults(defineProps<FingerProps>(), {
  width: 1000,
  height: 1000,
  thumbF: () => [100, 100, 0, 0],
  indexF: () => [100, 100, 0, 0, 0],
  middleF: () => [100, 100, 0, 0, 0],
  ringF: () => [100, 100, 0, 0, 0],
  littleF: () => [100, 100, 0, 0, 0],
  duration: 0.2,
  fingerSize: 20,
})

type FingerName = 'thumbF' | 'indexF' | 'middleF' | 'ringF' | 'littleF'

const JOINTS: Record<FingerName, number> = {
  thumbF: 2,
  indexF: 3,
  middleF: 3,
  ringF: 3,
  littleF: 3,
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
  const names: FingerName[] = ['thumbF', 'indexF', 'middleF', 'ringF', 'littleF']
  for (const name of names) {
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

function startTween() {
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

const fingers = computed(() => {
  const size = shown.fingerSize
  return [
    {id: 'little', pose: shown.poses.littleF, segments: littleSegments, size},
    {id: 'ring', pose: shown.poses.ringF, segments: ringSegments, size},
    {id: 'middle', pose: shown.poses.middleF, segments: middleSegments, size},
    {id: 'index', pose: shown.poses.indexF, segments: indexSegments, size},
    {id: 'thumb', pose: shown.poses.thumbF, segments: thumbSegments, size},
  ]
})
</script>

<template>
  <svg
    class="deciphony-finger"
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
  </svg>
</template>
