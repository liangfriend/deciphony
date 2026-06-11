<script lang="ts" setup>
import { computed, CSSProperties, onMounted, PropType, ref, watch } from 'vue'
import { Animateion, VideoNode, LayoutNode } from '@/types'
import { LayoutPositionEnum, ObjectFitEnum } from '@/enum'
import { useAnimateion } from '@/composables/useAnimateion'
import { gsap } from 'gsap'

const props = defineProps({
  layout: {
    type: Object as PropType<LayoutNode>,
    required: true
  },
  videoNode: {
    type: Object as PropType<VideoNode>,
    required: true
  },
  canvasWidth: Number,
  canvasHeight: Number
})

// 计算布局位置
const layoutStyle = computed(() => {
  const { left, right, top, bottom, width, height, applyPosition } = props.layout as LayoutNode
  const { canvasWidth, canvasHeight } = props as { canvasWidth: number; canvasHeight: number }

  let x = 0,
    y = 0
  switch (applyPosition) {
    case LayoutPositionEnum.LT:
      x = left
      y = top
      break
    case LayoutPositionEnum.LB:
      x = left
      y = canvasHeight - bottom - height
      break
    case LayoutPositionEnum.RT:
      x = canvasWidth - right - width
      y = top
      break
    case LayoutPositionEnum.RB:
      x = canvasWidth - right - width
      y = canvasHeight - bottom - height
      break
  }
  return { x, y, width, height }
})

const objectFitMode = computed(() =>
  props.layout.objectFit === ObjectFitEnum.Fill ? 'fill' : 'contain'
)

const videoStyle = computed(
  (): CSSProperties => ({
    objectFit: objectFitMode.value,
    width: '100%',
    height: '100%'
  })
)

// ✅ 这里改成 gRef，而不是 imgRef
const gRef = ref<SVGGElement | null>(null)

// 动画监听
const { animationMap } = useAnimateion()
watch(
  () => animationMap.value.get(props.videoNode.id),
  (anim: Animateion | undefined) => {
    if (!anim || !gRef.value) return

    const {
      scale,
      offsetX,
      offsetY,
      rotate,
      transformOrigin,
      duration,
      opacity,
      keepFinalState,
      loop
    } = anim

    gsap.killTweensOf(gRef.value)
    gsap.to(gRef.value, {
      duration: duration / 1000,
      scale,
      x: `+=${offsetX}`, // ✅ 关键！相对移动，不覆盖初始 x
      y: `+=${offsetY}`, // ✅ 关键！相对移动，不覆盖初始 y
      rotation: rotate,
      opacity,
      transformOrigin: `${transformOrigin[0]}px ${transformOrigin[1]}px`,
      ease: 'power2.out',
      repeat: loop ? -1 : 0,
      yoyo: loop,
      onComplete: () => {
        if (!keepFinalState && !loop) {
          gsap.set(gRef.value, { clearProps: 'transform,opacity' })
        }
      }
    })
  },
  { deep: true }
)

onMounted(() => {
  // 设定初始 transform， 让gsap来管理初始坐标，是因为如果直接放置layout到g标签，出现动画时就会因为样式重叠而错乱
  gsap.set(gRef.value, {
    x: layoutStyle.value.x,
    y: layoutStyle.value.y,
    scale: props.layout.scale,
    rotation: props.layout.rotation,
    transformOrigin: `${layoutStyle.value.width / 2}px ${layoutStyle.value.height / 2}px`
  })
})
</script>

<template>
  <g ref="gRef">
    <foreignObject :height="layoutStyle.height" :width="layoutStyle.width">
      <video
        ref="videoRef"
        :height="layoutStyle.height"
        :src="videoNode.url"
        :style="videoStyle"
        :width="layoutStyle.width"
      ></video>
    </foreignObject>
  </g>
</template>
