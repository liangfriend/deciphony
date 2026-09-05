<script lang="ts" setup>
import {computed, inject, onBeforeUnmount, onMounted, ref, type Ref} from 'vue'
import MusicScoreVue from '@deciphony/renderer'
import {drLyrics} from '@deciphony/extensions/dr-lyrics'
import {drTitle} from '@deciphony/extensions/dr-title'
import {
  usePlayHighlight,
  type MusicScoreHighlightExpose,
} from '@deciphony/extensions/dr-play-highlight'
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
}>()

type ScoreRegistry = {
  register: (host: ScorePlayHost) => void
  unregister: (scoreId: string) => void
}

const registry = inject<ScoreRegistry | null>('sjwScoreRegistry', null)
const getBpm = inject<() => number>('sjwGetBpm', () => 120)

const musicScoreRef = ref<MusicScoreHighlightExpose | null>(null)
/** 进入 SJWPDF 的曲谱固定展示：标题/歌词均不可编辑 */
const extensions = [drTitle({mode: 'show'}), drLyrics({mode: 'show'})]

const {
  handleRenderMusicScore,
  handleProgressStart,
  handlePlaybackEnd,
  handlePlaybackStop,
  handlePlaybackPause,
} = usePlayHighlight({
  musicScoreRef: musicScoreRef as Ref<MusicScoreHighlightExpose | null>,
  getBpm,
})

const naturalW = computed(() => props.score.musicScore.width || 1)
const naturalH = computed(() => props.score.musicScore.height || 1)
const scaleX = computed(() => props.score.width / naturalW.value)
const scaleY = computed(() => props.score.height / naturalH.value)

onMounted(() => {
  registry?.register({
    scoreId: props.score.id,
    handleProgressStart,
    handlePlaybackEnd,
    handlePlaybackStop,
    handlePlaybackPause,
  })
})

onBeforeUnmount(() => {
  registry?.unregister(props.score.id)
})
</script>

<template>
  <EditFrame
    :editable="editable"
    :element="score"
    :move-on-body="true"
    :selected="selected"
    @select="emit('select')"
  >
    <foreignObject
      :height="score.height"
      :width="score.width"
      x="0"
      y="0"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" class="sjw-score">
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
            @renderMusicScore="handleRenderMusicScore"
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
