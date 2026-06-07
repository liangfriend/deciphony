<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import AddMeasureButton from './AddMeasureButton.vue'
import AddSingleStaffButton from './AddSingleStaffButton.vue'
import DeleteSingleStaffButton from './DeleteSingleStaffButton.vue'

/** s-d 插槽：单谱表删除 + 添加 + 小节添加按钮组合 */
defineProps<{ node: VDom }>()
</script>

<template>
  <DeleteSingleStaffButton :node="node"/>
  <AddSingleStaffButton :node="node"/>
  <AddMeasureButton :node="node"/>
</template>
