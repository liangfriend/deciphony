<script lang="ts" setup>
import {computed} from 'vue'
import type {SkinItem} from '@/types/common'
import SkinSymbolPreview from './SkinSymbolPreview.vue'
import {getPreviewNodeSize, getSkinColorValue, isColorOnlySkinItem} from './skinPreview'

const props = defineProps<{
  name: string
  category: string
  item: SkinItem
}>()

const emit = defineEmits<{
  edit: []
}>()

const isColorOnly = computed(() => isColorOnlySkinItem(props.item))
const previewSize = computed(() => getPreviewNodeSize(props.name, props.item))

const sizeLabel = computed(() => {
  if (isColorOnly.value) return getSkinColorValue(props.item)
  return `${previewSize.value.w.toFixed(2)}×${previewSize.value.h.toFixed(2)}`
})

function onClick() {
  emit('edit')
}
</script>

<template>
  <div class="skin-cell">
    <button
      type="button"
      class="symbol-card"
      :title="`${category} / ${name}`"
      @click="onClick"
    >
      <SkinSymbolPreview bare :name="name" :item="item" />
    </button>
    <div class="skin-cell__name">{{ name }}</div>
    <div class="skin-cell__size">{{ sizeLabel }}</div>
  </div>
</template>

<style scoped>
.skin-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100px;
}

.symbol-card {
  width: 100px;
  height: 100px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.symbol-card:hover {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.symbol-card:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

.skin-cell__name {
  font-size: 11px;
  color: #303133;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
  max-width: 100px;
}

.skin-cell__size {
  font-size: 10px;
  color: #909399;
}
</style>
