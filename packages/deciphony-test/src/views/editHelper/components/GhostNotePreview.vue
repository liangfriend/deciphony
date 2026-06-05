<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import type {GhostNotePreview as GhostNotePreviewState} from '../renderEditSymbolAddAction'

const props = defineProps<{
  node: VDom
  preview: GhostNotePreviewState | null
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
