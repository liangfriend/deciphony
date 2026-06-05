<script lang="ts" setup>
import {ref} from 'vue'

const props = defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const addInput = ref(1)

function emitValue(next: number[]) {
  emit('update:modelValue', next.length > 0 ? next : [1])
}

function removeAt(index: number) {
  const next = props.modelValue.filter((_, i) => i !== index)
  emitValue(next)
}

function addValue() {
  const n = Math.trunc(addInput.value)
  if (!Number.isFinite(n) || n < 1) return
  if (props.modelValue.includes(n)) return
  emitValue([...props.modelValue, n].sort((a, b) => a - b))
}
</script>

<template>
  <div class="volta-value-editor">
    <div class="volta-value-editor__tags">
      <el-tag
        v-for="(value, index) in modelValue"
        :key="`${value}-${index}`"
        closable
        size="small"
        type="success"
        @close="removeAt(index)"
      >
        {{ value }}
      </el-tag>
      <span v-if="modelValue.length === 0" class="volta-value-editor__empty">至少保留一项</span>
    </div>
    <div class="volta-value-editor__add">
      <el-input-number
        v-model="addInput"
        :min="1"
        :step="1"
        controls-position="right"
        size="small"
      />
      <el-button size="small" type="primary" @click="addValue">添加</el-button>
    </div>
    <p class="volta-value-editor__hint">表示第几遍播放时经过（从 1 起）</p>
  </div>
</template>

<style scoped>
.volta-value-editor__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 24px;
  margin-bottom: 8px;
}

.volta-value-editor__empty {
  font-size: 12px;
  color: #909399;
}

.volta-value-editor__add {
  display: flex;
  gap: 8px;
  align-items: center;
}

.volta-value-editor__hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
}
</style>
