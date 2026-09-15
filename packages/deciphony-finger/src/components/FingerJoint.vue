<script lang="ts" setup>
import FingerJoint from './FingerJoint.vue'
import type {FingerPart} from '../parts'

const props = defineProps<{
  part: FingerPart
  angle: number
  restParts: FingerPart[]
  restAngles: number[]
}>()
</script>

<template>
  <g :transform="`rotate(${angle})`">
    <image
      :href="part.href"
      :x="part.viewBox.x"
      :y="part.viewBox.y"
      :width="part.viewBox.w"
      :height="part.viewBox.h"
      preserveAspectRatio="none"
    />
    <g
      v-if="restParts.length"
      :transform="`translate(${-part.length} 0)`"
    >
      <FingerJoint
        :part="restParts[0]!"
        :angle="restAngles[0] ?? 0"
        :rest-parts="restParts.slice(1)"
        :rest-angles="restAngles.slice(1)"
      />
    </g>
  </g>
</template>
