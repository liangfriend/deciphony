<script lang="ts" setup>
import type {SlotData} from '@deciphony/renderer'
import {tabStringCount} from '@deciphony/extensions/dr-edit'
import {computed} from 'vue'
import type {PropertyPanelKind} from '../renderEditPropertyPanel'
import NumberHeadPropertyPanel from '../numberNotation/components/NumberHeadPropertyPanel.vue'
import NoteHeadPropertyPanel from '../standardStaff/components/NoteHeadPropertyPanel.vue'
import BendPropertyPanel from '../tab/components/BendPropertyPanel.vue'
import TabMeasurePropertyPanel from '../tab/components/TabMeasurePropertyPanel.vue'
import TabNotePropertyPanel from '../tab/components/TabNotePropertyPanel.vue'
import TabSlurPropertyPanel from '../tab/components/TabSlurPropertyPanel.vue'
import DrumNotePropertyPanel from '../drumNotation/components/DrumNotePropertyPanel.vue'
import DrumRestPropertyPanel from '../drumNotation/components/DrumRestPropertyPanel.vue'
import MeasurePropertyPanel from './MeasurePropertyPanel.vue'
import VoltaPropertyPanel from './VoltaPropertyPanel.vue'

const props = defineProps<{
  kind: PropertyPanelKind
  selected: SlotData | null
}>()

const stringCount = computed(() => tabStringCount(props.selected?.musicScore.type))

const panelTitle: Record<Exclude<PropertyPanelKind, null>, string> = {
  measure: '小节属性',
  noteHead: '音符头属性',
  numberHead: '音符属性',
  volta: 'Volta 属性',
  tabMeasure: '小节属性',
  tabNote: '音符属性',
  slur: '连音线属性',
  bend: '推弦属性',
  drumNote: '鼓谱音符属性',
  drumRest: '休止符属性',
}
</script>

<template>
  <aside v-if="kind && selected" class="property-panel">
    <header class="property-panel__header">
      <h3 class="property-panel__title">
        {{ panelTitle[kind] }}
      </h3>
    </header>
    <div class="property-panel__body">
      <MeasurePropertyPanel
        v-if="kind === 'measure' && selected.measure && selected.singleStaff"
        :edit-slot="selected"
      />
      <NoteHeadPropertyPanel
        v-else-if="kind === 'noteHead' && selected.info && selected.note && selected.measure"
        :edit-slot="selected as any"
      />
      <NumberHeadPropertyPanel
        v-else-if="kind === 'numberHead' && selected.info && selected.note && selected.measure"
        :edit-slot="selected as any"
      />
      <VoltaPropertyPanel
        v-else-if="kind === 'volta'"
        :edit-slot="selected"
      />
      <TabMeasurePropertyPanel
        v-else-if="kind === 'tabMeasure'"
        :edit-slot="selected"
      />
      <TabNotePropertyPanel
        v-else-if="kind === 'tabNote'"
        :edit-slot="selected"
        :string-count="stringCount"
      />
      <TabSlurPropertyPanel
        v-else-if="kind === 'slur'"
        :edit-slot="selected"
      />
      <BendPropertyPanel
        v-else-if="kind === 'bend'"
        :edit-slot="selected"
      />
      <DrumNotePropertyPanel
        v-else-if="kind === 'drumNote'"
        :edit-slot="selected"
      />
      <DrumRestPropertyPanel
        v-else-if="kind === 'drumRest'"
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
