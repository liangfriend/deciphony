<script lang="ts" setup>
import type {VDom} from '@deciphony/renderer'
import {computed} from 'vue'
import type {GhostDrumPreview as GhostDrumPreviewState} from '../renderEditDrumAddAction'

const props = defineProps<{
  node: VDom
  preview: GhostDrumPreviewState | null
  measureId?: string | null
}>()

const show = computed(
  () =>
    props.preview != null
    && props.measureId != null
    && props.node.slotData?.measure?.id === props.measureId,
)
</script>

<template>
  <g
    v-if="show && preview"
    :transform="`translate(${preview.x}, ${preview.y})`"
    class="ghost-drum-preview"
    pointer-events="none"
    v-html="preview.svgHtml"
  />
</template>

<style scoped>
.ghost-drum-preview {
  opacity: 0.45;
}
</style>
