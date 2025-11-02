<script lang="ts" setup>
import {computed, CSSProperties, inject, onBeforeMount, PropType, ref, Ref} from 'vue';


import {Measure, type MusicScore,} from "../../../deciphony-core/src/types";
import {MusicScoreShowModeEnum} from "../../../deciphony-core/src/musicScoreEnum";

const props = defineProps({
  measure: {
    type: Object as PropType<Measure>,
    required: true,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  width: {
    type: Number,
    default: 400,
  },
  height: {
    type: Number,
    default: 80,
  },
  componentWidth: {
    type: Number,
    default: 1000,
  },
  componentHeight: {
    type: Number,
    default: 800,
  },
  strokeWidth: {
    type: Number,
    default: 1
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },

});
// 皮肤
const {svgSkin, isOriginSkin} = inject("skin") as {
  isOriginSkin: Ref<boolean>,
  svgSkin: Ref<Record<string, { url: string; }>>
}

const measureStyle = computed(() => {
  return {
    'width': '100%',
    'display': 'grid',
    'grid-template-rows': '1fr',
    'grid-template-columns': `1fr`,

  };
});
const barHref = computed(() => {
  switch (props.musicScore.showMode) {
    case MusicScoreShowModeEnum.standardStaff: {
      return props.measure?.options.highlight ? svgSkin.value.active_bar_standardStaff.url : svgSkin.value.bar_standardStaff.url
    }
    case MusicScoreShowModeEnum.numberNotation: {
      return props.measure?.options.highlight ? svgSkin.value.active_bar_numberNotation.url : svgSkin.value.bar_numberNotation.url
    }
  }
  return ''
})
const barLineStyle = computed((): CSSProperties => {
  const style: CSSProperties = {
    width: (props.width) + 'px',
    height: props.height + 'px',
    'background-color': props.measure?.options.highlight ? props.measure?.options.highlightColor : props.measure?.options.color,
    mask: `url("${barHref.value}") no-repeat center`,
    'mask-size': '100% 100%',
    pointerEvents: 'none',
  };

  return style

});
const emits = defineEmits(['measureMouseDown']);

function handleMouseDown(e: MouseEvent) {
  emits('measureMouseDown', e, props.measure)
}

</script>
<template>
  <div :style="measureStyle" class="measure" @mousedown.self="handleMouseDown">
    <div v-if="isOriginSkin" :style="barLineStyle"></div>
    <img v-else :src="barHref" :style="barLineStyle"/>
  </div>
</template>
<style lang="scss" scoped>
img {
  display: block;
}

.measure {
  pointer-events: all;
}
</style>