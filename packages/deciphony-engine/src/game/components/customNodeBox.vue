<script lang="ts" setup>
import {computed, onMounted, PropType, ref, watch} from 'vue'
import {storeToRefs} from 'pinia'
import {Animateion, CustomNode, CustomNodeSlotProps, LayoutNode} from '../../types'
import {LayoutPositionEnum} from '../../enum'
import {enginePinia} from '../../store/pinia'
import {useAnimateionStore} from '../../store/useAnimateionStore'
import {parseJS} from '../../utils/execJS'
import {gsap} from 'gsap'

const props = defineProps({
  layout: {
    type: Object as PropType<LayoutNode>,
    required: true
  },
  customNode: {
    type: Object as PropType<CustomNode>,
    required: true
  },
  canvasWidth: Number,
  canvasHeight: Number
})

defineSlots<{
  default(props: CustomNodeSlotProps): unknown
}>()

const layoutStyle = computed(() => {
  const {left, right, top, bottom, width, height, applyPosition} = props.layout as LayoutNode
  const {canvasWidth, canvasHeight} = props as { canvasWidth: number; canvasHeight: number }

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
  return {x, y, width, height}
})

const slotData = computed((): Record<string, unknown> => {
  const parsed = parseJS(props.customNode.data)
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
})

const gRef = ref<SVGGElement | null>(null)

const {animationMap} = storeToRefs(useAnimateionStore(enginePinia))
watch(
  () => animationMap.value.get(props.customNode.id),
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
      x: `+=${offsetX}`,
      y: `+=${offsetY}`,
      rotation: rotate,
      opacity,
      transformOrigin: `${transformOrigin[0]}px ${transformOrigin[1]}px`,
      ease: 'power2.out',
      repeat: loop ? -1 : 0,
      yoyo: loop,
      onComplete: () => {
        if (!keepFinalState && !loop) {
          gsap.set(gRef.value, {clearProps: 'transform,opacity'})
        }
      }
    })
  },
  {deep: true}
)

onMounted(() => {
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
      <div xmlns="http://www.w3.org/1999/xhtml" class="custom-node-slot">
        <slot :custom-node="customNode" :data="slotData" :layout="layout" />
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.custom-node-slot {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  pointer-events: auto;
}
</style>
