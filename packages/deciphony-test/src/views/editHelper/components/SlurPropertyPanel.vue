<script lang="ts" setup>
import type {DoubleNoteAffiliatedSymbol, SlotData, VDom} from '@deciphony/renderer'
import {resetSlurRelativeOffset} from '../renderEditSlurDrag'
import type {UpdateVDomFn} from '../scoreWriteGate'

const props = defineProps<{
  editSlot: SlotData
  getUpdateVDom?: () => UpdateVDomFn | undefined
  getLiveVDom?: (targetId: string) => VDom | undefined
}>()

function resetAlign() {
  const slur = props.editSlot.self as DoubleNoteAffiliatedSymbol
  resetSlurRelativeOffset(
      props.editSlot.musicScore,
      slur.id,
      () => props.getUpdateVDom?.(),
      () => props.getLiveVDom?.(slur.id),
  )
}
</script>

<template>
  <section class="slur-props">
    <div class="slur-props__label">对齐</div>
    <button class="slur-props__btn" type="button" @click="resetAlign">重置对齐</button>
    <p class="slur-props__hint">把起止 / 控制点的 relative 偏移清零，恢复默认锚点位置</p>
  </section>
</template>

<style scoped>
.slur-props {
  margin-top: 12px;
}

.slur-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.slur-props__btn {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #303133;
  font-size: 13px;
  cursor: pointer;
}

.slur-props__btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.slur-props__hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}
</style>
