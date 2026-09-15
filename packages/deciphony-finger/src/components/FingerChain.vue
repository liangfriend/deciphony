<script lang="ts" setup>
import FingerJoint from './FingerJoint.vue'
import type {FingerPart} from '../parts'

const props = defineProps<{
  x: number
  y: number
  size: number
  angles: number[]
  segments: FingerPart[]
}>()
</script>

<template>
  <g :transform="`translate(${x} ${y})`">
    <g :transform="`scale(${size})`">
      <FingerJoint
        v-if="segments.length"
        :part="segments[0]!"
        :angle="angles[0] ?? 0"
        :rest-parts="segments.slice(1)"
        :rest-angles="angles.slice(1)"
      />
    </g>
  </g>
</template>
