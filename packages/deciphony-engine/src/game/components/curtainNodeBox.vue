<script lang="ts" setup>
import {onMounted, PropType, ref} from 'vue'
import {storeToRefs} from 'pinia'
import {CurtainNode} from '../../types'
import {gsap} from 'gsap'
import {CurtainTypeEnum} from '../../enum'
import {enginePinia} from '../../store/pinia'
import {useGameStore} from '../../store/useGameStore'

const props = defineProps({
  curtainNode: {
    type: Object as PropType<CurtainNode>,
    required: true
  },
  canvasWidth: {type: Number, required: true},
  canvasHeight: {type: Number, required: true}
})

// 是否用图片填充
const useImage = !!props.curtainNode.url
const patternId = `pattern_${props.curtainNode.id}`
const hold = 0.5
// DOM refs
const rectRef = ref<SVGRectElement | null>(null)
const leftRef = ref<SVGRectElement | null>(null)
const rightRef = ref<SVGRectElement | null>(null)
const {viewerCurtainNodeMap} = storeToRefs(useGameStore(enginePinia))
onMounted(() => {
  const duration = (props.curtainNode.anDuration ?? 0) / 1000
  const delay = (props.curtainNode.delay ?? 0) / 1000
  const moveTime = (duration * (1 - hold)) / 2
  const holdTime = duration * hold

  const tl = gsap.timeline({delay})

  switch (props.curtainNode.curtainType) {
    case CurtainTypeEnum.FadeInOut:
      tl.fromTo(
        rectRef.value,
        {opacity: 0},
        {opacity: 1, duration: moveTime, ease: 'power1.inOut'}
      )
      .to(rectRef.value, {opacity: 1, duration: holdTime})
      .to(rectRef.value, {opacity: 0, duration: moveTime, ease: 'power1.inOut'})
      break

    case CurtainTypeEnum.SlideUpInUpOut:
      tl.fromTo(
        rectRef.value,
        {y: -props.canvasHeight},
        {y: 0, duration: moveTime, ease: 'power1.inOut'}
      )
      .to(rectRef.value, {y: 0, duration: holdTime})
      .to(rectRef.value, {y: -props.canvasHeight, duration: moveTime, ease: 'power1.inOut'})
      break

    case CurtainTypeEnum.Door: {
      // 先初始化右侧翻转（不影响动画）
      gsap.set(rightRef.value, {
        scaleX: -1,
        transformOrigin: 'center'
      })

      // 左右对开门动画
      tl.fromTo(
        [leftRef.value, rightRef.value],
        {xPercent: (v) => (v === 0 ? -100 : 100)},
        {xPercent: 0, duration: moveTime, ease: 'power1.inOut'}
      )
      .to({}, {duration: holdTime})
      .to([leftRef.value, rightRef.value], {
        xPercent: (v) => (v === 0 ? -100 : 100),
        duration: moveTime,
        ease: 'power1.inOut'
      })
      break
    }
  }
})
</script>

<template>
  <svg :height="canvasHeight" :width="canvasWidth" class="curtain-layer">
    <!-- 图片模式填充定义 -->
    <defs v-if="useImage">
      <pattern :id="patternId" height="1" patternUnits="objectBoundingBox" width="1">
        <image
          :height="canvasHeight"
          :href="curtainNode.url"
          :width="canvasWidth"
          preserveAspectRatio="xMidYMid slice"
        />
      </pattern>
    </defs>

    <!-- ✅ 纯色 / 图片 单幕布 -->
    <rect
      v-if="curtainNode.curtainType !== CurtainTypeEnum.Door"
      ref="rectRef"
      :fill="useImage ? `url(#${patternId})` : curtainNode.color"
      :height="canvasHeight"
      :width="canvasWidth"
    />

    <!-- ✅ Door 需要两片门 -->
    <template v-else>
      <rect
        ref="leftRef"
        :fill="useImage ? `url(#${patternId})` : curtainNode.color"
        :height="canvasHeight"
        :width="canvasWidth / 2"
        x="0"
      />
      <rect
        ref="rightRef"
        :fill="useImage ? `url(#${patternId})` : curtainNode.color"
        :height="canvasHeight"
        :width="canvasWidth / 2"
        :x="canvasWidth / 2"
      />
    </template>
  </svg>
</template>

<style scoped>
.curtain-layer {
  overflow: visible;
}
</style>
