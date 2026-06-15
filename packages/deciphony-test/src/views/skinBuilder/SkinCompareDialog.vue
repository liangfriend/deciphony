<script lang="ts" setup>
import {computed} from 'vue'
import musicScoreVue from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import type {Skin, SkinPack, SlotConfig} from '@/types/common'
import skinExhibitStandardStaff from '../data/skinExhibitStandardStaff'
import skinExhibitNumberNotation from '../data/skinExhibitNumberNotation'

const props = defineProps<{
  modelValue: boolean
  sourceSkin: SkinPack
  draftSkin: SkinPack
  /** 与皮肤编辑器当前分类一致 */
  notationCategory: 'standardStaff' | 'numberNotation'
}>()

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
}>()

const exhibitSlotConfig: SlotConfig = {
  'g-l': {w: 20},
}

const exhibitData = computed((): MusicScore => {
  return props.notationCategory === 'numberNotation'
    ? skinExhibitNumberNotation
    : skinExhibitStandardStaff
})

const notationLabel = computed(() =>
  props.notationCategory === 'numberNotation' ? '简谱' : '五线谱',
)

const leftSkin = computed((): Skin => ({
  default: props.sourceSkin,
}))

const rightSkin = computed((): Skin => ({
  default: props.draftSkin,
}))

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="`皮肤对照预览 · ${notationLabel}`"
    fullscreen
    :close-on-click-modal="false"
    destroy-on-close
    class="skin-compare-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="skin-compare-dialog__toolbar">
      <span class="skin-compare-dialog__hint">
        左：源 default.json · 右：当前编辑中 · 曲谱：skinExhibit{{ notationCategory === 'numberNotation' ? 'NumberNotation' : 'StandardStaff' }}
      </span>
      <el-button @click="close">关闭</el-button>
    </div>

    <div class="skin-compare-dialog__panels">
      <section class="skin-compare-panel">
        <header class="skin-compare-panel__head">源皮肤 default.json</header>
        <div class="skin-compare-panel__scroll">
          <musicScoreVue
            :data="exhibitData"
            :slot-config="exhibitSlotConfig"
            :skin="leftSkin"
            skin-name="default"
          />
        </div>
      </section>

      <section class="skin-compare-panel skin-compare-panel--draft">
        <header class="skin-compare-panel__head">编辑中（未保存导出）</header>
        <div class="skin-compare-panel__scroll">
          <musicScoreVue
            :data="exhibitData"
            :slot-config="exhibitSlotConfig"
            :skin="rightSkin"
            skin-name="default"
          />
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<style scoped>
.skin-compare-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.skin-compare-dialog__hint {
  font-size: 13px;
  color: #606266;
}

.skin-compare-dialog__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  height: calc(100vh - 120px);
  min-height: 400px;
}

.skin-compare-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.skin-compare-panel--draft {
  border-color: #409eff;
}

.skin-compare-panel__head {
  flex-shrink: 0;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.skin-compare-panel--draft .skin-compare-panel__head {
  background: #ecf5ff;
  color: #409eff;
}

.skin-compare-panel__scroll {
  flex: 1;
  overflow: auto;
  padding: 8px;
}
</style>
