<template>
  <div class="measure" :style="measureStyle" @mousedown.self="handleMouseDown">
    <div :style="barLineStyle"></div>
  </div>
</template>
<script setup lang="ts">
import {computed, CSSProperties, PropType} from 'vue';

import barStandardStaff from '../assets/msSymbols/bar-standardStaff.svg';
import barNumberNotation from '../assets/msSymbols/bar-numberNotation.svg';
import {Measure,} from "../../../deciphony-core/src/types";
import {MusicScoreShowModeEnum} from "../../../deciphony-core/src/musicScoreEnum";

const props = defineProps({
  measure: {
    type: Object as PropType<Measure>,
    required: true,
  },
  showMode: {
    type: MusicScoreShowModeEnum,
    required: true
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
  }

});

const measureStyle = computed(() => {
  return {
    'width': '100%',
    'display': 'grid',
    'grid-template-rows': '1fr',
    'grid-template-columns': `1fr`,

  };
});
const barLineStyle = computed((): CSSProperties => {
  const style: CSSProperties = {
    width: (props.width) + 'px',
    height: props.height + 'px',
    'background-color': 'black',
    // mask:`url("${barLine}") no-repeat center`,
    // 'mask-size': '100% 100%',
    background: props.measure.options.highlight ? props.measure.options.highlightColor : props.measure.options.color,
    pointerEvents: 'none',
  };
  switch (props.showMode) {
    case MusicScoreShowModeEnum.standardStaff: {
      style.mask = `url("${barStandardStaff}") no-repeat center`
      style['mask-size'] = '100% 100%'
      break
    }
    case MusicScoreShowModeEnum.numberNotation: {
      style.mask = `url("${barNumberNotation}") no-repeat center` // 这里有个bug,mask-size写到mask之前，会不生效
      style['mask-size'] = '100% 100%'

      break
    }
  }
  return style
});
const emits = defineEmits(['measureMouseDown']);

function handleMouseDown(e: MouseEvent) {
  emits('measureMouseDown', e, props.measure)

}

</script>
<style scoped lang="scss">
img {
  display: block;
}

.measure {
  pointer-events: all;
}
</style>