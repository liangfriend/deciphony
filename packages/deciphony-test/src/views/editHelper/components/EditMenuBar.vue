<script lang="ts" setup>
import type {Chronaxie, SlotData, VDom} from '@deciphony/renderer'
import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  isFretboardScoreType,
} from '@deciphony/renderer'
import {tabStringCount} from '@deciphony/extensions/dr-edit'
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import type {PropertyPanelKind} from '../renderEditPropertyPanel'
import type {UpdateVDomFn} from '../scoreWriteGate'
import {isVoltaSelected} from '../renderEditVoltaDrag'
import {
  CHRONAXIE_ICON_VIEWBOX,
  chronaxieNoteInnerHtml,
} from '../chronaxieIcon'
import {CHRONAXIE_OPTIONS} from '../renderEditAddNoteState'
import {
  ACCIDENTAL_SELECT_OPTIONS,
  AUGMENTATION_DOT_OPTIONS,
  BEAM_TYPE_OPTIONS,
  setNotesInfoAccidental,
  setNotesInfoAugmentationDot,
  setNotesInfoBeamType,
  setNotesInfoChronaxie,
} from '../standardStaff/renderEditNoteHeadProperties'
import {SLUR_SPAN_OPTIONS, tryAddSlurFromNoteHead, type SlurSpan} from '../standardStaff/renderEditSlurAdd'
import {
  OCTAVE_DOT_OPTIONS,
  SYLLABLE_OPTIONS,
  setNotesNumberInfoAccidental,
  setNotesNumberInfoAugmentationDot,
  setNotesNumberInfoBeamType,
  setNotesNumberInfoChronaxie,
  setNotesNumberInfoOctaveDot,
  setNotesNumberInfoSyllable,
} from '../numberNotation/renderEditNumberHeadProperties'
import {tryAddSlurFromNumberHead} from '../numberNotation/renderEditSlurAdd'
import {
  BARLINE_OPTIONS,
  CLEF_OPTIONS,
  END_REPEAT_OPTIONS,
  KEY_SIGNATURE_OPTIONS,
  START_REPEAT_OPTIONS,
  TIME_SIGNATURE_OPTIONS,
  insertMeasureAfter,
  insertMeasureBefore,
  setMeasureBarlineB,
  setMeasureBarlineF,
  setMeasureClefF,
  setMeasureEndRepeat,
  setMeasureKeySignatureF,
  setMeasureStartRepeat,
  setMeasureTimeSignatureF,
  type MeasureEditSlot,
} from '../renderEditMeasureProperties'
import {VOLTA_SPAN_OPTIONS, tryAddVoltaFromMeasure} from '../renderEditVoltaAdd'
import BendPropertyPanel from '../tab/components/BendPropertyPanel.vue'
import TabMeasurePropertyPanel from '../tab/components/TabMeasurePropertyPanel.vue'
import TabNotePropertyPanel from '../tab/components/TabNotePropertyPanel.vue'
import TabSlurPropertyPanel from '../tab/components/TabSlurPropertyPanel.vue'
import DrumNotePropertyPanel from '../drumNotation/components/DrumNotePropertyPanel.vue'
import DrumRestPropertyPanel from '../drumNotation/components/DrumRestPropertyPanel.vue'
import VoltaPropertyPanel from './VoltaPropertyPanel.vue'
import SlurPropertyPanel from './SlurPropertyPanel.vue'

type CheckItem = {
  kind: 'check'
  label: string
  checked: boolean
  run: () => void
  close?: boolean
}

type ActionItem = {
  kind: 'action'
  label: string
  run: () => void
  close?: boolean
}

type IconItem = {
  kind: 'icons'
  options: {value: Chronaxie; label: string; html: string}[]
  current: Chronaxie
  run: (v: Chronaxie) => void
}

type SepItem = {kind: 'sep'}

type PanelItem = {
  kind: 'panel'
  panel: 'volta' | 'tabMeasure' | 'tabNote' | 'slur' | 'bend' | 'drumNote' | 'drumRest'
}

type MenuItem = CheckItem | ActionItem | IconItem | SepItem | PanelItem

type MenuDef = {
  id: string
  label: string
  items: MenuItem[]
}

const props = defineProps<{
  kind: PropertyPanelKind
  selected: SlotData | null
  getUpdateVDom?: () => UpdateVDomFn | undefined
  getLiveVDom?: (targetId: string) => VDom | undefined
}>()

const openId = ref<string | null>(null)
const barEl = ref<HTMLElement | null>(null)

const stringCount = computed(() => tabStringCount(props.selected?.musicScore.type))
const isTabSlur = computed(() =>
  !!props.selected && isFretboardScoreType(props.selected.musicScore.type),
)

const chronaxieIcons = CHRONAXIE_OPTIONS.map((opt) => ({
  ...opt,
  html: chronaxieNoteInnerHtml(opt.value),
}))

function checkItems<T extends string | number>(
  options: {value: T; label: string}[],
  current: T | '' | null | undefined,
  set: (v: T | '') => void,
  withNone = false,
): MenuItem[] {
  const items: MenuItem[] = []
  if (withNone) {
    items.push({
      kind: 'check',
      label: '无',
      checked: current === '' || current == null,
      run: () => set(''),
      close: true,
    })
    items.push({kind: 'sep'})
  }
  for (const opt of options) {
    items.push({
      kind: 'check',
      label: opt.label,
      checked: current === opt.value,
      run: () => set(opt.value),
      close: true,
    })
  }
  return items
}

const menus = computed<MenuDef[]>(() => {
  const selected = props.selected
  if (!selected || !props.kind) return []

  if (props.kind === 'measure' && selected.measure && selected.singleStaff) {
    const slot = selected as MeasureEditSlot
    const m = slot.measure
    return [
      {
        id: 'ops',
        label: '小节',
        items: [
          {kind: 'action', label: '前插小节', run: () => insertMeasureBefore(slot), close: true},
          {kind: 'action', label: '后插小节', run: () => insertMeasureAfter(slot), close: true},
        ],
      },
      {
        id: 'barlineB',
        label: '后置线',
        items: checkItems(
          BARLINE_OPTIONS,
          m.barline_b?.type ?? BarlineTypeEnum.Single_barline,
          (v) => setMeasureBarlineB(m, v as BarlineTypeEnum),
        ),
      },
      {
        id: 'barlineF',
        label: '前置线',
        items: checkItems(
          BARLINE_OPTIONS,
          m.barline_f?.type ?? '',
          (v) => setMeasureBarlineF(m, v === '' ? null : (v as BarlineTypeEnum)),
          true,
        ),
      },
      {
        id: 'clef',
        label: '谱号',
        items: checkItems(
          CLEF_OPTIONS,
          m.clef_f?.type ?? '',
          (v) => setMeasureClefF(m, v === '' ? null : v),
          true,
        ),
      },
      {
        id: 'key',
        label: '调号',
        items: checkItems(
          KEY_SIGNATURE_OPTIONS,
          m.keySignature_f?.type ?? '',
          (v) => setMeasureKeySignatureF(m, v === '' ? null : v),
          true,
        ),
      },
      {
        id: 'time',
        label: '拍号',
        items: checkItems(
          TIME_SIGNATURE_OPTIONS,
          m.timeSignature_f?.type ?? '',
          (v) => setMeasureTimeSignatureF(m, v === '' ? null : v),
          true,
        ),
      },
      {
        id: 'startRep',
        label: '前反复',
        items: checkItems(
          START_REPEAT_OPTIONS,
          m.startRepeat?.type ?? '',
          (v) => setMeasureStartRepeat(m, v === '' ? null : v),
          true,
        ),
      },
      {
        id: 'endRep',
        label: '后反复',
        items: checkItems(
          END_REPEAT_OPTIONS,
          m.endRepeat?.type ?? '',
          (v) => setMeasureEndRepeat(m, v === '' ? null : v),
          true,
        ),
      },
      {
        id: 'volta',
        label: 'Volta',
        items: [
          ...VOLTA_SPAN_OPTIONS.map((span) => ({
            kind: 'action' as const,
            label: `添加 ${span} 小节`,
            run: () => tryAddVoltaFromMeasure(slot, span),
            close: true,
          })),
        ],
      },
    ]
  }

  if (props.kind === 'noteHead' && selected.info && selected.note && selected.measure) {
    const info = selected.info as import('@deciphony/renderer').NotesInfo
    const editSlot = selected as any
    return [
      {
        id: 'chronaxie',
        label: '时值',
        items: [{
          kind: 'icons',
          options: chronaxieIcons,
          current: info.chronaxie,
          run: (v) => setNotesInfoChronaxie(info, v),
        }],
      },
      {
        id: 'beam',
        label: '符杠',
        items: checkItems(
          BEAM_TYPE_OPTIONS,
          info.beamType ?? BeamTypeEnum.None,
          (v) => setNotesInfoBeamType(info, v as BeamTypeEnum),
        ),
      },
      {
        id: 'acc',
        label: '变音',
        items: checkItems(
          ACCIDENTAL_SELECT_OPTIONS as {value: AccidentalTypeEnum | ''; label: string}[],
          info.accidental?.type ?? '',
          (v) => setNotesInfoAccidental(info, v as AccidentalTypeEnum | ''),
        ),
      },
      {
        id: 'dot',
        label: '附点',
        items: checkItems(
          AUGMENTATION_DOT_OPTIONS,
          (info.augmentationDot?.count ?? 0) as 0 | 1 | 2 | 3,
          (v) => setNotesInfoAugmentationDot(info, v as 0 | 1 | 2 | 3),
        ),
      },
      {
        id: 'slur',
        label: '连音线',
        items: SLUR_SPAN_OPTIONS.map((span) => ({
          kind: 'action' as const,
          label: `跨 ${span} 个音符`,
          run: () => tryAddSlurFromNoteHead(editSlot, span as SlurSpan),
          close: true,
        })),
      },
    ]
  }

  if (props.kind === 'numberHead' && selected.info && selected.note && selected.measure) {
    const info = selected.info as import('@deciphony/renderer').NotesNumberInfo
    const editSlot = selected as any
    return [
      {
        id: 'syllable',
        label: '唱名',
        items: checkItems(
          SYLLABLE_OPTIONS,
          info.syllable,
          (v) => setNotesNumberInfoSyllable(info, v as typeof info.syllable),
        ),
      },
      {
        id: 'octave',
        label: '八度',
        items: checkItems(
          OCTAVE_DOT_OPTIONS,
          info.octaveDot ?? 0,
          (v) => setNotesNumberInfoOctaveDot(info, v as typeof info.octaveDot),
        ),
      },
      {
        id: 'chronaxie',
        label: '时值',
        items: [{
          kind: 'icons',
          options: chronaxieIcons,
          current: info.chronaxie,
          run: (v) => setNotesNumberInfoChronaxie(info, v),
        }],
      },
      {
        id: 'beam',
        label: '减时线',
        items: checkItems(
          BEAM_TYPE_OPTIONS,
          info.beamType ?? BeamTypeEnum.None,
          (v) => setNotesNumberInfoBeamType(info, v as BeamTypeEnum),
        ),
      },
      {
        id: 'acc',
        label: '变音',
        items: checkItems(
          ACCIDENTAL_SELECT_OPTIONS as {value: AccidentalTypeEnum | ''; label: string}[],
          info.accidental?.type ?? '',
          (v) => setNotesNumberInfoAccidental(info, v as AccidentalTypeEnum | ''),
        ),
      },
      {
        id: 'dot',
        label: '附点',
        items: checkItems(
          AUGMENTATION_DOT_OPTIONS,
          (info.augmentationDot?.count ?? 0) as 0 | 1 | 2 | 3,
          (v) => setNotesNumberInfoAugmentationDot(info, v as 0 | 1 | 2 | 3),
        ),
      },
      {
        id: 'slur',
        label: '连音线',
        items: SLUR_SPAN_OPTIONS.map((span) => ({
          kind: 'action' as const,
          label: `跨 ${span} 个音符`,
          run: () => tryAddSlurFromNumberHead(editSlot, span as SlurSpan),
          close: true,
        })),
      },
    ]
  }

  if (props.kind === 'volta') return [{id: 'volta', label: 'Volta', items: [{kind: 'panel', panel: 'volta'}]}]
  if (props.kind === 'tabMeasure') return [{id: 'tabMeasure', label: '小节', items: [{kind: 'panel', panel: 'tabMeasure'}]}]
  if (props.kind === 'tabNote') return [{id: 'tabNote', label: '音符', items: [{kind: 'panel', panel: 'tabNote'}]}]
  if (props.kind === 'slur') return [{id: 'slur', label: '连音线', items: [{kind: 'panel', panel: 'slur'}]}]
  if (props.kind === 'bend') return [{id: 'bend', label: '推弦', items: [{kind: 'panel', panel: 'bend'}]}]
  if (props.kind === 'drumNote') return [{id: 'drumNote', label: '鼓音符', items: [{kind: 'panel', panel: 'drumNote'}]}]
  if (props.kind === 'drumRest') return [{id: 'drumRest', label: '休止符', items: [{kind: 'panel', panel: 'drumRest'}]}]
  return []
})

watch(
  () => props.kind,
  () => {
    openId.value = null
  },
)

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}

function onTitleEnter(id: string) {
  if (openId.value != null) openId.value = id
}

function runItem(item: CheckItem | ActionItem) {
  item.run()
  if (item.close !== false) openId.value = null
}

function onDocPointerDown(ev: PointerEvent) {
  const el = barEl.value
  if (!el) return
  if (ev.target instanceof Node && el.contains(ev.target)) return
  openId.value = null
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
})
</script>

<template>
  <nav v-if="kind && selected && menus.length" ref="barEl" class="edit-menubar">
    <div
      v-for="menu in menus"
      :key="menu.id"
      class="edit-menubar__menu"
    >
      <button
        class="edit-menubar__title"
        :class="{'edit-menubar__title--open': openId === menu.id}"
        type="button"
        @click="toggle(menu.id)"
        @mouseenter="onTitleEnter(menu.id)"
      >
        {{ menu.label }}
      </button>
      <div v-if="openId === menu.id" class="edit-menubar__dropdown">
        <template v-for="(item, idx) in menu.items" :key="idx">
          <div v-if="item.kind === 'sep'" class="edit-menubar__sep"/>

          <button
            v-else-if="item.kind === 'check' || item.kind === 'action'"
            class="edit-menubar__item"
            type="button"
            @click="runItem(item)"
          >
            <span class="edit-menubar__check">{{ item.kind === 'check' && item.checked ? '✓' : '' }}</span>
            <span>{{ item.label }}</span>
          </button>

          <div v-else-if="item.kind === 'icons'" class="edit-menubar__icons">
            <button
              v-for="opt in item.options"
              :key="opt.value"
              class="edit-menubar__icon-item"
              :class="{'edit-menubar__icon-item--on': item.current === opt.value}"
              :title="opt.label"
              type="button"
              @click="item.run(opt.value); openId = null"
            >
              <svg
                class="edit-menubar__icon-svg"
                :viewBox="CHRONAXIE_ICON_VIEWBOX"
                xmlns="http://www.w3.org/2000/svg"
                v-html="opt.html"
              />
            </button>
          </div>

          <div v-else-if="item.kind === 'panel'" class="edit-menubar__panel">
            <VoltaPropertyPanel
              v-if="item.panel === 'volta' && isVoltaSelected(selected)"
              :edit-slot="selected"
            />
            <TabMeasurePropertyPanel
              v-else-if="item.panel === 'tabMeasure'"
              :edit-slot="selected"
            />
            <TabNotePropertyPanel
              v-else-if="item.panel === 'tabNote'"
              :edit-slot="selected"
              :string-count="stringCount"
            />
            <template v-else-if="item.panel === 'slur'">
              <TabSlurPropertyPanel v-if="isTabSlur" :edit-slot="selected"/>
              <SlurPropertyPanel
                :edit-slot="selected"
                :get-update-v-dom="getUpdateVDom"
                :get-live-v-dom="getLiveVDom"
              />
            </template>
            <BendPropertyPanel
              v-else-if="item.panel === 'bend'"
              :edit-slot="selected"
            />
            <DrumNotePropertyPanel
              v-else-if="item.panel === 'drumNote'"
              :edit-slot="selected"
            />
            <DrumRestPropertyPanel
              v-else-if="item.panel === 'drumRest'"
              :edit-slot="selected"
            />
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.edit-menubar {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  min-height: 28px;
  padding: 0 4px;
  background: #ece9d8;
  border-bottom: 1px solid #aca899;
  font-family: "Segoe UI", "Microsoft YaHei UI", Tahoma, sans-serif;
  font-size: 13px;
  user-select: none;
}

.edit-menubar__menu {
  position: relative;
}

.edit-menubar__title {
  height: 100%;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #000;
  cursor: default;
  line-height: 26px;
}

.edit-menubar__title:hover,
.edit-menubar__title--open {
  background: #316ac5;
  border-color: #316ac5;
  color: #fff;
}

.edit-menubar__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 40;
  min-width: 180px;
  max-width: min(420px, 92vw);
  max-height: min(70vh, 560px);
  overflow: auto;
  padding: 2px 0;
  background: #fff;
  border: 1px solid #aca899;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.edit-menubar__item {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 4px 24px 4px 8px;
  border: 0;
  background: transparent;
  color: #000;
  text-align: left;
  cursor: default;
  white-space: nowrap;
}

.edit-menubar__item:hover {
  background: #316ac5;
  color: #fff;
}

.edit-menubar__check {
  display: inline-block;
  width: 14px;
  flex: 0 0 14px;
  font-size: 12px;
  line-height: 1;
}

.edit-menubar__sep {
  height: 1px;
  margin: 3px 8px;
  background: #aca899;
}

.edit-menubar__icons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
}

.edit-menubar__icon-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #c0c4cc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.edit-menubar__icon-item:hover {
  border-color: #316ac5;
  background: #e8f0fe;
}

.edit-menubar__icon-item--on {
  border-color: #316ac5;
  background: #d0e2ff;
}

.edit-menubar__icon-svg {
  width: 20px;
  height: 26px;
  overflow: visible;
  pointer-events: none;
}

.edit-menubar__panel {
  padding: 8px 10px 10px;
  min-width: 260px;
}
</style>
