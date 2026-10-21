<script lang="ts" setup>
defineProps<{
  active?: boolean
  title?: string
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="edit-tb-btn"
    :class="{'edit-tb-btn--active': active}"
    :disabled="disabled"
    :title="title"
    type="button"
    @click="$emit('click')"
  >
    <slot/>
  </button>
</template>

<style scoped>
.edit-tb-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #c0c4cc;
  border-radius: 8px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  flex: 0 0 auto;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
}

.edit-tb-btn:hover:not(:disabled) {
  border-color: #409eff;
  background: #ecf5ff;
}

.edit-tb-btn--active {
  border-color: #409eff;
  background: #d9ecff;
  box-shadow: inset 0 0 0 1px #409eff;
}

.edit-tb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
