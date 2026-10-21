<script lang="ts" setup>
import type {Chronaxie} from '@deciphony/renderer'
import {computed} from 'vue'
import {
  CHRONAXIE_ICON_VIEWBOX,
  chronaxieNoteInnerHtml,
  chronaxieRestInnerHtml,
} from '../chronaxieIcon'
import EditToolbarButton from './EditToolbarButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue: Chronaxie
    options: {value: Chronaxie; label: string}[]
    /** note = 音符头；rest = 休止符 */
    mode?: 'note' | 'rest'
  }>(),
  {mode: 'note'},
)

const emit = defineEmits<{
  'update:modelValue': [value: Chronaxie]
}>()

const icons = computed(() =>
  props.options.map((opt) => ({
    ...opt,
    html:
      props.mode === 'rest'
        ? chronaxieRestInnerHtml(opt.value)
        : chronaxieNoteInnerHtml(opt.value),
  })),
)
</script>

<template>
  <div class="chronaxie-icons">
    <EditToolbarButton
      v-for="opt in icons"
      :key="opt.value"
      :active="modelValue === opt.value"
      :title="opt.label"
      @click="emit('update:modelValue', opt.value)"
    >
      <svg
        class="chronaxie-icons__svg"
        :viewBox="CHRONAXIE_ICON_VIEWBOX"
        xmlns="http://www.w3.org/2000/svg"
        v-html="opt.html"
      />
    </EditToolbarButton>
  </div>
</template>

<style scoped>
.chronaxie-icons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chronaxie-icons__svg {
  width: 22px;
  height: 28px;
  overflow: visible;
  pointer-events: none;
}
</style>
