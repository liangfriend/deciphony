<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import type {GhostNumberPreview as GhostNumberPreviewState} from '../renderEditNumberAddAction'

const props = defineProps<{
  node: VDom
  preview: GhostNumberPreviewState | null
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
    class="ghost-note-preview"
    pointer-events="none"
    v-html="preview.svgHtml"
  />
</template>
