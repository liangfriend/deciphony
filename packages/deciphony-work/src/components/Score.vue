<script lang="ts" setup>
import {computed, inject, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import MusicScoreVue from '@deciphony/renderer'
import type {Skin} from '@deciphony/renderer'
import {drLyrics} from '@deciphony/extensions/dr-lyrics'
import {drTitle} from '@deciphony/extensions/dr-title'
import {drPlayHighlight} from '@deciphony/extensions/dr-play-highlight'
import {drInstrumentName} from '@deciphony/extensions/dr-instrument-name'
import {parseSkinFile} from '../assets/skinAsset'
import type {SScore} from '../types/types'
import type {ScorePlayHost} from '../play/scorePlayback'
import EditFrame from './EditFrame.vue'

const props = defineProps<{
  score: SScore
  /** 仅控制放置框（移/拉/转），曲谱内容始终展示、不可编辑 */
  editable: boolean
  selected: boolean
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

const registry = inject<ScoreRegistry | null>('sjwScoreRegistry', null)
const getBpm = inject<() => number>('sjwGetBpm', () => 120)
const getAsset = inject<(id: string) => File | undefined>('sjwGetAsset', () => undefined)

const musicScoreRef = ref<MusicScoreExpose | null>(null)
/** 从资源缓存解析出的 Skin；无 skin id 或加载失败则为 undefined（用 renderer 内置） */
const resolvedSkin = ref<Skin | undefined>()

const playHighlight = drPlayHighlight({
  findElementByVDom: (node) => musicScoreRef.value?.findElementByVDom(node) ?? null,
  getBpm,
})

/** 音色名与谱表的间距：须大于连谱号宽度（bracket 约 12px，画在 s-l 最右侧），与宿主编辑器一致 */
const INSTRUMENT_NAME_GAP = 18
const instrumentName = drInstrumentName({gap: INSTRUMENT_NAME_GAP})
const baseExtensions = [drTitle({mode: 'show'}), drLyrics({mode: 'show'}), playHighlight]

type ScoreLayoutData = {
  /** s-l 插槽宽度（左留白），与宿主编辑器一致 */
  sLSlotW?: unknown
  /** 是否在 s-l 显示单谱表音色名（singleStaff.data.instrumentName） */
  showInstrumentName?: unknown
}

const layoutData = computed(() => (props.score.musicScore.data ?? {}) as ScoreLayoutData)

/** 进入 SJWPDF 的曲谱固定展示；高亮经 extensions.on.renderMusicScore */
const extensions = computed(() =>
  layoutData.value.showInstrumentName === true ? [...baseExtensions, instrumentName] : baseExtensions,
)

const slotConfig = computed(() => {
  const w = Number(layoutData.value.sLSlotW)
  return Number.isFinite(w) && w >= 0 ? {'s-l': {w}} : {}
})

const naturalW = computed(() => props.score.musicScore.width || 1)
const naturalH = computed(() => props.score.musicScore.height || 1)
const scaleX = computed(() => props.score.width / naturalW.value)
const scaleY = computed(() => props.score.height / naturalH.value)

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
  registry?.unregister(props.score.id)
})
</script>

<template>
  <EditFrame
    :editable="editable"
    :element="score"
    :move-on-body="true"
    :selected="selected"
    show-hit-overlay
    @contextmenu="emit('contextmenu', $event)"
    @select="emit('select')"
  >
    <foreignObject
      :height="score.height"
      :width="score.width"
      x="0"
      y="0"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="sjw-score"
        @contextmenu.prevent.stop="emit('contextmenu', $event)"
      >
        <div
          class="sjw-score__inner"
          :style="{
            width: `${naturalW}px`,
            height: `${naturalH}px`,
            transform: `scale(${scaleX}, ${scaleY})`,
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

.sjw-score__inner :deep(.dr-play-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 64, 64, 0.95)) brightness(1.18) saturate(1.35);
}
</style>
