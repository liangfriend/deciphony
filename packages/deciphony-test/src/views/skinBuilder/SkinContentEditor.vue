<script lang="ts" setup>
import {computed, ref} from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const lineNumsRef = ref<HTMLDivElement>()

const lineCount = computed(() => {
  const n = props.modelValue.split('\n').length
  return Math.max(n, 1)
})

const lineNumbersText = computed(() =>
  Array.from({length: lineCount.value}, (_, i) => i + 1).join('\n')
)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab') return
  e.preventDefault()
  const el = textareaRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const val = props.modelValue
  const next = `${val.slice(0, start)}  ${val.slice(end)}`
  emit('update:modelValue', next)
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = start + 2
  })
}

function syncLineScroll() {
  const ta = textareaRef.value
  const ln = lineNumsRef.value
  if (ta && ln) ln.scrollTop = ta.scrollTop
}
</script>

<template>
  <div class="skin-content-editor">
    <div ref="lineNumsRef" class="skin-content-editor__gutter" aria-hidden="true">
      {{ lineNumbersText }}
    </div>
    <textarea
      ref="textareaRef"
      class="skin-content-editor__input"
      :value="modelValue"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      @input="onInput"
      @keydown="onKeydown"
      @scroll="syncLineScroll"
    />
  </div>
</template>

<style scoped>
.skin-content-editor {
  display: flex;
  height: 360px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.skin-content-editor__gutter {
  flex-shrink: 0;
  width: 40px;
  padding: 8px 6px 8px 0;
  box-sizing: border-box;
  text-align: right;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #909399;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
  white-space: pre;
  user-select: none;
}

.skin-content-editor__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 8px 10px;
  border: none;
  outline: none;
  resize: none;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
  background: transparent;
  tab-size: 2;
}
</style>
