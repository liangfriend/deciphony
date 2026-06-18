<script lang="ts" setup>
import {computed, reactive, watch} from 'vue'
import type {SkinItem} from '@/types/common'
import SkinContentEditor from './SkinContentEditor.vue'
import SkinSymbolPreview from './SkinSymbolPreview.vue'
import {isColorOnlySkinContent} from '@/render/resolveSkinColor'

export type SkinSymbolEditTarget = {
  categoryId: 'standardStaff' | 'numberNotation'
  categoryLabel: string
  key: string
  item: SkinItem
}

const props = defineProps<{
  modelValue: boolean
  target: SkinSymbolEditTarget | null
}>()

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  save: [payload: {content: string; w: number; h: number}]
}>()

const draft = reactive({
  content: '',
  w: 0,
  h: 0,
})

const isColorOnly = computed(() =>
  props.target ? isColorOnlySkinContent(draft.content) : false
)

function formatRatio(value: number | undefined) {
  return value == null ? '—' : String(value)
}

const draftItem = computed((): SkinItem | null => {
  if (!props.target) return null
  return {
    ...props.target.item,
    content: draft.content,
    w: draft.w,
    h: draft.h,
  }
})

watch(
  () => props.target,
  (target) => {
    if (!target) return
    draft.content = target.item.content
    draft.w = target.item.w
    draft.h = target.item.h
  },
  {immediate: true}
)

function close() {
  emit('update:modelValue', false)
}

function onCancel() {
  close()
}

function onSave() {
  emit('save', {
    content: draft.content,
    w: draft.w,
    h: draft.h,
  })
  close()
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="target ? `${target.categoryLabel} / ${target.key}` : '编辑符号'"
    width="860px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    destroy-on-close
    class="skin-edit-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="target && draftItem" class="skin-edit-dialog__body">
      <div class="skin-edit-dialog__preview-col">
        <div class="skin-edit-dialog__label">预览</div>
        <SkinSymbolPreview
          use-raw-size
          show-dom-metrics
          :preview-box="120"
          :name="target.key"
          :item="draftItem"
        />
        <div class="skin-edit-dialog__meta">
          <div>skinKey: {{ target.item.skinKey }}</div>
          <div>widthRatio: {{ formatRatio(target.item.widthRatio) }}</div>
          <div>widthRatioForMeasure: {{ formatRatio(target.item.widthRatioForMeasure) }}</div>
        </div>
      </div>

      <div class="skin-edit-dialog__form-col">
        <div class="skin-edit-dialog__row skin-edit-dialog__row--size">
          <label class="skin-edit-dialog__label">width</label>
          <el-input-number
            v-model="draft.w"
            :precision="2"
            :step="0.1"
            controls-position="right"
            class="skin-edit-dialog__number"
          />
          <label class="skin-edit-dialog__label">height</label>
          <el-input-number
            v-model="draft.h"
            :precision="2"
            :step="0.1"
            controls-position="right"
            class="skin-edit-dialog__number"
          />
        </div>

        <div class="skin-edit-dialog__row">
          <label class="skin-edit-dialog__label">
            content
            <span v-if="isColorOnly" class="skin-edit-dialog__hint">（颜色值）</span>
          </label>
          <el-input
            v-if="isColorOnly"
            v-model="draft.content"
            placeholder="如 black、#000000"
          />
          <SkinContentEditor v-else v-model="draft.content" />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" @click="onSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.skin-edit-dialog__body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.skin-edit-dialog__preview-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 140px;
  flex-shrink: 0;
}

.skin-edit-dialog__form-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skin-edit-dialog__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skin-edit-dialog__row--size {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.skin-edit-dialog__label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.skin-edit-dialog__hint {
  font-weight: 400;
  color: #909399;
}

.skin-edit-dialog__number {
  width: 140px;
}

.skin-edit-dialog__meta {
  font-size: 11px;
  color: #909399;
  text-align: center;
  word-break: break-all;
  line-height: 1.5;
  width: 100%;
}
</style>
