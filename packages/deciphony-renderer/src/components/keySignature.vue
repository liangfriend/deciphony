<script setup lang="ts">
import {computed, CSSProperties, inject, PropType, Ref} from "vue";
import {
  KeySignatureMsSymbol,
  MsSymbol,
  type MusicScore
} from "../../../deciphony-core/src/types";
import {
  ClefEnum,
  KeySignatureEnum,
  MsSymbolTypeEnum
} from "../../../deciphony-core/src/musicScoreEnum";

import {getMsSymbolClef} from "deciphony-core";


const props = defineProps({
  keySignature: {
    type: Object as PropType<KeySignatureMsSymbol>,
    required: true,
  },
  slotWidth: {
    type: Number,
    default: 50,
  },
  measureHeight: {
    type: Number,
    default: 60,
  },
  musicScore: {
    type: Object as PropType<MusicScore>,
    default: {}
  },

});
// 皮肤
// 皮肤
const {svgSkin, isOriginSkin} = inject("skin") as {
  isOriginSkin: Ref<boolean>,
  svgSkin: Ref<Record<string, { url: string; }>>
}
const clef = computed((): ClefEnum => {
  if (!props.keySignature) return ClefEnum.Treble
  return getMsSymbolClef(props.keySignature, props.musicScore)
})
const keySignatureInfo = computed(() => {
  const map: Record<KeySignatureEnum, { type: 'flat' | 'sharp' | 'none', count: number }> = {
    'Cb': {type: 'flat', count: 7},
    'Gb': {type: 'flat', count: 6},
    'Db': {type: 'flat', count: 5},
    'Ab': {type: 'flat', count: 4},
    'Eb': {type: 'flat', count: 3},
    'Bb': {type: 'flat', count: 2},
    'F': {type: 'flat', count: 1},
    'C': {type: 'none', count: 0},
    'G': {type: 'sharp', count: 1},
    'D': {type: 'sharp', count: 2},
    'A': {type: 'sharp', count: 3},
    'E': {type: 'sharp', count: 4},
    'B': {type: 'sharp', count: 5},
    'F#': {type: 'sharp', count: 6},
    'C#': {type: 'sharp', count: 7},
  }
  if (props.keySignature.type === MsSymbolTypeEnum.KeySignature) {
    return map[props.keySignature.keySignature];
  } else {
    console.error("keySignature出错，没有keySignature属性", props.keySignature)
    return map[KeySignatureEnum.C];
  }

});

const symbolSrc = computed(() =>
    keySignatureInfo.value.type === 'sharp' ? svgSkin.value.accidental_sharp.url : svgSkin.value.accidental_flat.url
);

// 五线谱间距单位
const spacing = computed(() => props.measureHeight / 8);

// 三种谱号对应的升降号垂直位置，单位是谱线间距 multiples，0为最低线（第一线）
const sharpPositionsMap: Partial<Record<ClefEnum, Array<number>>> = {
  [ClefEnum.Treble]: [8, 5, 9, 6, 3, 7, 4],
  [ClefEnum.Alto]: [7, 4, 8, 5, 2, 6, 3], // 中音谱号
  [ClefEnum.Bass]: [6, 3, 7, 4, 1, 5, 2],  // 低音谱号升号位置，模拟五线谱线和间的对应

};
// TODO 后续要补全所有clef
const flatPositionsMap: Partial<Record<ClefEnum, Array<number>>> = {
  [ClefEnum.Treble]: [5, 8, 4, 7, 3, 6, 2],
  [ClefEnum.Alto]: [4, 7, 3, 6, 2, 5, 1],
  [ClefEnum.Bass]: [3, 6, 2, 5, 1, 4, 0],

};

const verticalOffsets = computed(() => {
  if (keySignatureInfo.value.type === 'sharp') {
    const positions = (sharpPositionsMap[clef.value] || sharpPositionsMap[ClefEnum.Treble])!;
    return positions
        .slice(0, keySignatureInfo.value.count)
        .map(p => p * spacing.value);
  }
  if (keySignatureInfo.value.type === 'flat') {
    const positions = (flatPositionsMap[clef.value] || flatPositionsMap[ClefEnum.Treble])!;
    return positions
        .slice(0, keySignatureInfo.value.count)
        .map(p => p * spacing.value);
  }
  return [];
});

const getSymbolStyle = computed(() => {
  const symbolSize = props.measureHeight * 0.5;
  const horizontalGap = props.measureHeight * 0.25;
  return (index: number, yOffset: number): CSSProperties => {
    return {
      width: symbolSize + 'px',
      height: symbolSize + 'px',
      position: 'absolute',
      pointerEvents: 'none',
      left: `${index * horizontalGap}px`,
      top: `${props.measureHeight - yOffset - symbolSize / 2}px`,
      backgroundColor: props.keySignature.options.highlight ? props.keySignature.options.highlightColor : props.keySignature.options.color,
      maskImage: `url("${symbolSrc.value}")`,
      WebkitMaskImage: `url("${symbolSrc.value}")`,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
    };
  };
});
</script>
<template>
  <div
      class="keySignature"
  >
    <div
        v-for="(yOffset, i) in verticalOffsets"
        :key="i"
        class="symbol"
        :style="getSymbolStyle(i, yOffset)"
    ></div>
  </div>
</template>
<style scoped>
.keySignature {
  position: relative;
}

.symbol {
  object-fit: contain;
}


</style>
