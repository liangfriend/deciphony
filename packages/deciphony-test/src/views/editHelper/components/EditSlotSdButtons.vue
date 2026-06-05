<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import AddMeasureButton from './AddMeasureButton.vue'
import AddSingleStaffButton from './AddSingleStaffButton.vue'

/** s-d 插槽：单谱表 + 小节添加按钮组合 */
defineProps<{ node: VDom }>()
</script>

<template>
  <AddSingleStaffButton :node="node"/>
  <AddMeasureButton :node="node"/>
</template>
