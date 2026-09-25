<script lang="ts" setup>
import type {VDom} from '@deciphony/renderer'
import {computed} from 'vue'
import type {GhostTabPreview as GhostTabPreviewState} from '../renderEditTabAddAction'

const props = defineProps<{
  node: VDom
  preview: GhostTabPreviewState | null
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
    class="ghost-tab-preview"
    pointer-events="none"
    v-html="preview.svgHtml"
  />
</template>

<style scoped>
.ghost-tab-preview {
  opacity: 0.45;
}
</style>
