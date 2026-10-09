<script lang="ts" setup>
import {computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref} from 'vue'
import MusicScoreVue from '@deciphony/renderer'
import type {DrExtension, Skin, VDom, VDomLookup} from '@deciphony/renderer'
import {drLyrics} from '@deciphony/extensions/dr-lyrics'
import {drTitle} from '@deciphony/extensions/dr-title'
import {NOTE_PART_TAGS, drPlayHighlight} from '@deciphony/extensions/dr-play-highlight'
import {drInstrumentName} from '@deciphony/extensions/dr-instrument-name'
import {parseSkinFile} from '../assets/skinAsset'
import {syncScoreFrame} from '../api/crop'
import {
  INSTRUMENT_NAME_GAP,
  scoreLyricsFontFamily,
  scoreLyricsFontSize,
  scoreShowsInstrumentName,
  scoreSlotConfig,
  scoreTitleFontFamily,
  scoreViewRect,
} from '../render/scoreDisplay'
import type {ScoreRangeSelect, SScore} from '../types/types'
import type {ScorePlayHost} from '../play/scorePlayback'
import EditFrame from './EditFrame.vue'

const props = defineProps<{
  score: SScore
  /** 仅控制放置框（移/拉/转），曲谱内容始终展示、不可编辑 */
  editable: boolean
  selected: boolean
  /** 裁剪模式：显示整份曲谱（裁掉部分由 EditFrame 蒙白），四角改裁剪区域 */
  cropping?: boolean
}>()

const emit = defineEmits<{
  select: []
  contextmenu: [ev: MouseEvent]
}>()

type ScoreRegistry = {
  register: (host: ScorePlayHost) => void
  unregister: (scoreId: string) => void
}

type MusicScoreExpose = {
  findElementByVDom: (node: import('@deciphony/renderer').VDom) => SVGElement | null
}

type RangeSelectContext = {
  state: Ref<ScoreRangeSelect | null>
  onNoteClick: (scoreId: string, noteId: string) => void
}

const registry = inject<ScoreRegistry | null>('sjwScoreRegistry', null)
const rangeSelect = inject<RangeSelectContext | null>('sjwRangeSelect', null)
const getBpm = inject<() => number>('sjwGetBpm', () => 120)
const getAsset = inject<(id: string) => File | undefined>('sjwGetAsset', () => undefined)

const musicScoreRef = ref<MusicScoreExpose | null>(null)
/** 从资源缓存解析出的 Skin；无 skin id 或加载失败则为 undefined（用 renderer 内置） */
const resolvedSkin = ref<Skin | undefined>()

const playHighlight = drPlayHighlight({
  findElementByVDom: (node) => musicScoreRef.value?.findElementByVDom(node) ?? null,
  getBpm,
})

const instrumentName = drInstrumentName({gap: INSTRUMENT_NAME_GAP})
const lyricsFontSize = computed(() => scoreLyricsFontSize(props.score.musicScore))
const lyricsFontFamily = computed(() => scoreLyricsFontFamily(props.score.musicScore))
const titleFontFamily = computed(() => scoreTitleFontFamily(props.score.musicScore))
/** 本曲谱处于选段模式：音符可点，放置框不拦指针 */
const rangeState = computed(() =>
  rangeSelect?.state.value?.scoreId === props.score.id ? rangeSelect.state.value : null,
)
const rangeActive = computed(() => rangeState.value != null)

const RANGE_START_CLASS = 'sjw-range-start'
const RANGE_END_CLASS = 'sjw-range-end'
let rangeVDomList: readonly VDom[] = []
let rangeLookup: VDomLookup | null = null
const rangeMarked = new Set<SVGElement>()

function clearRangeMarks() {
  for (const el of rangeMarked) el.classList.remove(RANGE_START_CLASS, RANGE_END_CLASS)
  rangeMarked.clear()
}

function markRangeNote(noteId: string | null | undefined, cls: string) {
  if (!noteId) return
  const nodes = rangeLookup ? rangeLookup.byTargetId(noteId) : rangeVDomList.filter((n) => n.targetId === noteId)
  for (const node of nodes) {
    if (!NOTE_PART_TAGS.has(node.tag)) continue
    const el = musicScoreRef.value?.findElementByVDom(node)
    if (!el) continue
    el.classList.add(cls)
    rangeMarked.add(el)
  }
}

function applyRangeMarks() {
  clearRangeMarks()
  const state = rangeState.value
  if (!state) return
  markRangeNote(state.startNoteId, RANGE_START_CLASS)
  markRangeNote(state.endNoteId, RANGE_END_CLASS)
}

/** 选段：点击音符部件（符头 / 简谱数字 / 品格 / 休止符…）取 targetId 交给 SJWPDF 走点击循环 */
const rangeSelectExtension: DrExtension = {
  name: 'sjw-range-select',
  on: {
    renderMusicScore(list, info) {
      rangeVDomList = list
      rangeLookup = info?.lookup ?? null
      // 事件在 vDom 更新后同步触发，DOM 还没 patch
      void nextTick(applyRangeMarks)
    },
    'dr-click'(event, node) {
      if (!rangeActive.value || !node.targetId || !NOTE_PART_TAGS.has(node.tag)) return
      event.stopPropagation()
      rangeSelect?.onNoteClick(props.score.id, node.targetId)
    },
  },
}

watch(
  () => [rangeState.value?.startNoteId, rangeState.value?.endNoteId, rangeActive.value],
  () => applyRangeMarks(),
)

const baseExtensions = [
  // t / g-d 高度由 scoreSlotConfig（读 musicScore.data）覆盖扩展默认
  drTitle({mode: 'show', fontFamily: titleFontFamily}),
  drLyrics({mode: 'show', fontSize: lyricsFontSize, fontFamily: lyricsFontFamily}),
  playHighlight,
  rangeSelectExtension,
]

/** 进入 SJWPDF 的曲谱固定展示；高亮经 extensions.on.renderMusicScore */
const extensions = computed(() =>
  scoreShowsInstrumentName(props.score.musicScore) ? [...baseExtensions, instrumentName] : baseExtensions,
)

const slotConfig = computed(() => scoreSlotConfig(props.score.musicScore))

const naturalW = computed(() => props.score.musicScore.width || 1)
const naturalH = computed(() => props.score.musicScore.height || 1)

watch([() => props.score, naturalW, naturalH], () => syncScoreFrame(props.score), {immediate: true})

const cropSource = computed(() => ({width: naturalW.value, height: naturalH.value}))
/** 框只显示 view（crop 或整份）这块区域并拉伸铺满；裁剪模式下 foreignObject 扩到整份曲谱 */
const contentLayout = computed(() => {
  const view = scoreViewRect(props.score)
  const sx = props.score.width / view.width
  const sy = props.score.height / view.height
  if (props.cropping) {
    return {
      x: -view.x * sx,
      y: -view.y * sy,
      width: naturalW.value * sx,
      height: naturalH.value * sy,
      transform: `scale(${sx}, ${sy})`,
    }
  }
  return {
    x: 0,
    y: 0,
    width: props.score.width,
    height: props.score.height,
    transform: `translate(${-view.x * sx}px, ${-view.y * sy}px) scale(${sx}, ${sy})`,
  }
})

watch(
  () => props.score.skin,
  async (skinId) => {
    if (!skinId) {
      resolvedSkin.value = undefined
      return
    }
    const file = getAsset(skinId)
    if (!file) {
      resolvedSkin.value = undefined
      return
    }
    try {
      resolvedSkin.value = await parseSkinFile(file)
    } catch {
      resolvedSkin.value = undefined
    }
  },
  {immediate: true},
)

onMounted(() => {
  registry?.register({
    scoreId: props.score.id,
    handleProgressStart: playHighlight.handleProgressStart,
    handlePlaybackEnd: playHighlight.handlePlaybackEnd,
    handlePlaybackStop: playHighlight.handlePlaybackStop,
    handlePlaybackPause: playHighlight.handlePlaybackPause,
    addNoteHighlight: playHighlight.addNoteHighlight,
    removeNoteHighlight: playHighlight.removeNoteHighlight,
    clearHighlight: playHighlight.clearHighlight,
  })
})

onBeforeUnmount(() => {
  playHighlight.handlePlaybackStop()
  clearRangeMarks()
  registry?.unregister(props.score.id)
})
</script>

<template>
  <EditFrame
    :editable="editable && !rangeActive"
    :element="score"
    :move-on-body="true"
    :selected="selected && !rangeActive"
    :show-hit-overlay="!rangeActive"
    :crop-source="cropping ? cropSource : null"
    @contextmenu="emit('contextmenu', $event)"
    @select="emit('select')"
  >
    <foreignObject
      :height="contentLayout.height"
      :width="contentLayout.width"
      :x="contentLayout.x"
      :y="contentLayout.y"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="sjw-score"
        :class="{'sjw-score--range': rangeActive}"
        @contextmenu.prevent.stop="emit('contextmenu', $event)"
      >
        <div
          class="sjw-score__inner"
          :style="{
            width: `${naturalW}px`,
            height: `${naturalH}px`,
            transform: contentLayout.transform,
          }"
        >
          <MusicScoreVue
            ref="musicScoreRef"
            :data="score.musicScore"
            :extensions="extensions"
            :slot-config="slotConfig"
            :skin="resolvedSkin"
          />
        </div>
      </div>
    </foreignObject>
  </EditFrame>
</template>

<style scoped>
.sjw-score {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  pointer-events: none;
}

.sjw-score__inner {
  transform-origin: top left;
  pointer-events: none;
}

.sjw-score__inner :deep(svg) {
  display: block;
}

.sjw-score--range,
.sjw-score--range .sjw-score__inner {
  pointer-events: auto;
  cursor: pointer;
}

.sjw-score__inner :deep(.sjw-range-start) {
  filter: drop-shadow(0 0 3px rgba(32, 160, 64, 0.95)) drop-shadow(0 0 1px rgba(32, 160, 64, 1));
}

.sjw-score__inner :deep(.sjw-range-end) {
  filter: drop-shadow(0 0 3px rgba(64, 128, 255, 0.95)) drop-shadow(0 0 1px rgba(64, 128, 255, 1));
}

.sjw-score__inner :deep(.sjw-range-start :is(path, rect, circle, ellipse, polygon, text):not([fill='none'])) {
  fill: #18a058;
}

.sjw-score__inner :deep(.sjw-range-end :is(path, rect, circle, ellipse, polygon, text):not([fill='none'])) {
  fill: #2f6bff;
}

.sjw-score__inner :deep(.dr-play-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 64, 64, 0.95)) brightness(1.18) saturate(1.35);
}
</style>
