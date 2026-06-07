<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import AddGrandStaffButton from './AddGrandStaffButton.vue'
import DeleteGrandStaffButton from './DeleteGrandStaffButton.vue'

/** g-d 插槽：复谱表删除 + 添加按钮组合 */
defineProps<{ node: VDom }>()
</script>

<template>
  <DeleteGrandStaffButton :node="node"/>
  <AddGrandStaffButton :node="node"/>
</template>
