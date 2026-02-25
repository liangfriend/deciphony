<template>
  <div class="container">
    <div class="left ">
      <music-score ref="msRef" :slot-config="{'g-r':{w:50}}" skin-name="default"
                   @pointerdown="handlePointerDown"
                   @pointermove="handlePointerMove"
                   @pointerup="handlePointerUp"
                   @renderMusicScore="renderMusicScore">
        <template #g="{ node }">
          <rect
            :data-slot-name="node.slotName??''"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            data-comment="插槽"
            fill="transparent"
            x="0"
            y="0"
          />
          <rect
            v-show="node.targetId === highlightTargetId"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            fill="transparent"
            stroke="red"
            stroke-dasharray="4 2"
            stroke-width="1"
            x="0"
            y="0"
          />
        </template>
        <template #s="{ node }">
          <rect
            :data-slot-name="node.slotName??''"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            data-comment="插槽"
            fill="transparent"
            x="0"
            y="0"
          />
          <rect
            v-show="node.targetId === highlightTargetId"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            fill="transparent"
            stroke="red"
            stroke-dasharray="4 2"
            stroke-width="1"
            x="0"
            y="0"
          />
        </template>
      </music-score>
    </div>
    <div class="right ">
      <button @click="test">测试</button>
    </div>
  </div>


</template>
<script lang="ts" setup>
import {nextTick, onMounted, ref} from 'vue'
import MusicScore from "deciphony-renderer";
import type {MusicScore as MusicScoreType, NotesInfo} from "deciphony-renderer";
import data from "./dr-render-extensions/mock/happyBirthday";

/** 小节高度、线宽、一间高度：由皮肤包决定，此处假定已明确 */
const MEASURE_HEIGHT = 45
const LINE_WIDTH = 1
const SPACE_HEIGHT = 10  // 每一间
/** 1 region 对应的像素（由实际布局决定） */
const PX_PER_REGION = 5.5

const msRef = ref(null)
onMounted(() => {
})

function renderMusicScore(vdom) {
}

const musicScoreData = ref(data)
const highlightTargetId = ref('')

/** 根据 NotesInfo.id 在曲谱中查找并返回 NotesInfo，用于编辑 region */
function findNotesInfoById(score: MusicScoreType, id: string): NotesInfo | null {
  for (const gs of score.grandStaffs ?? []) {
    for (const staff of gs.staves ?? []) {
      for (const measure of staff.measures ?? []) {
        for (const note of measure.notes ?? []) {
          if (!('type' in note) || note.type !== 'Note') continue
          const parts = [note.voicePart, note.voicePart2].filter(Boolean)
          for (const vp of parts) {
            for (const ni of vp.notesInfo ?? []) {
              if (ni.id === id) return ni
            }
          }
        }
      }
    }
  }
  return null
}

function applyHighlight() {
  const tid = highlightTargetId.value
  if (!tid) return
  msRef.value?.updateVDom((vdom) => {
    vdom.forEach(item => {
      item.skinName = item.targetId === tid ? 'red' : 'default'
    })
  })
}

const dragState = ref<{
  targetId: string
  startRegion: number
  startSvgY: number
} | null>(null)


function svgPointFromEvent(e: PointerEvent): { x: number; y: number } | null {
  const svg = msRef.value?.$el as SVGSVGElement | undefined
  // 检测兼容性
  if (!svg?.createSVGPoint) return null
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const m = svg.getScreenCTM()?.inverse()
  if (!m) return null
  return pt.matrixTransform(m)
}

function handlePointerDown(e: PointerEvent) {
  const el = (e.target as Element).closest?.('[data-target-id][data-tag]') ?? e.target
  const targetId = (el as Element).getAttribute?.('data-target-id') ?? ''
  const tag = (el as Element).getAttribute?.('data-tag') ?? ''
  highlightTargetId.value = targetId

  if (tag === 'slot') {
    // 插槽仅高亮，不高亮 vDom
  } else {
    applyHighlight()
    if (tag === 'noteHead' && targetId) {
      const pt = svgPointFromEvent(e)
      const ni = findNotesInfoById(musicScoreData.value, targetId)
      if (pt && ni) {
        dragState.value = {targetId, startRegion: ni.region, startSvgY: pt.y}
        ;(e.currentTarget as Element)?.setPointerCapture?.(e.pointerId)
      }
    }
  }
}

function handlePointerMove(e: PointerEvent) {
  const state = dragState.value
  if (!state) return
  const pt = svgPointFromEvent(e)
  if (!pt) return
  const deltaY = pt.y - state.startSvgY
  const newRegion = Math.round(state.startRegion - deltaY / PX_PER_REGION)
  const ni = findNotesInfoById(musicScoreData.value, state.targetId)
  if (ni && ni.region !== newRegion) {
    ni.region = newRegion
    nextTick(applyHighlight)
  }
}

function handlePointerUp(e: PointerEvent) {
  if (dragState.value) {
    ;(e.currentTarget as Element)?.releasePointerCapture?.(e.pointerId)
    dragState.value = null
  }
}

function test() {
  const note = musicScoreData.value.grandStaffs[0]?.staves[0]?.measures[0]?.notes[0]
  if (note && 'type' in note && note.type === 'Note') note.voicePart.notesInfo[0].region = 8

}
</script>
<style scoped>
.container {
  display: flex;
  justify-content: space-between;
}

.left {
  width: 100%;

}

.right {
  width: 100%;
}
</style>