<script setup lang="ts">
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
const barHref = ref('')
const barLineStyle = computed((): CSSProperties => {
  console.log('chicken',)
  const style: CSSProperties = {
    width: (props.width) + 'px',
    height: props.height + 'px',
    color: 'red',
    'background-color': 'transparent',
    // mask:`url("${barLine}") no-repeat center`,
    // 'mask-size': '100% 100%',
    pointerEvents: 'none',
  };
  switch (props.musicScore.showMode) {
    case MusicScoreShowModeEnum.standardStaff: {

      // style.mask = `url("${svgSkin.value.bar_standardStaff.url}") no-repeat center`
      // style['mask-size'] = '100% 100%'
      barHref.value = svgSkin.value.bar_standardStaff.url
      break
    }
    case MusicScoreShowModeEnum.numberNotation: {
      // style.mask = `url("${svgSkin.value.bar_numberNotation.url}") no-repeat center` // 这里有个bug,mask-size写到mask之前，会不生效
      // style['mask-size'] = '100% 100%'
      barHref.value = svgSkin.value.bar_numberNotation.url
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
<template>
  <div class="measure" :style="measureStyle" @mousedown.self="handleMouseDown">
    <img :style="barLineStyle" :src="barHref"/>
  </div>
</template>
<style scoped lang="scss">
img {
  display: block;
}

.measure {
  pointer-events: all;
}
</style>