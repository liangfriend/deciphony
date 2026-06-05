<script lang="ts" setup>
import type {SlotData} from 'deciphony-renderer'
import type {PropertyPanelKind} from '../renderEditPropertyPanel'
import MeasurePropertyPanel from './MeasurePropertyPanel.vue'

defineProps<{
  kind: PropertyPanelKind
  selected: SlotData | null
}>()
</script>

<template>
  <aside v-if="kind && selected" class="property-panel">
    <header class="property-panel__header">
      <h3 class="property-panel__title">
        {{ kind === 'measure' ? '小节属性' : '属性' }}
      </h3>
    </header>
    <div class="property-panel__body">
      <MeasurePropertyPanel
        v-if="kind === 'measure' && selected.measure && selected.singleStaff"
        :edit-slot="selected"
      />
    </div>
  </aside>
</template>

<style scoped>
.property-panel {
  flex: 0 0 280px;
  width: 280px;
  max-height: 100%;
  overflow: auto;
  border-left: 1px solid #e4e7ed;
  background: #fafbfc;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
}

.property-panel__header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 14px 16px 10px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.property-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.property-panel__body {
  padding: 8px 12px 16px;
}
</style>
