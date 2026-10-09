<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {MusicScoreTypeEnum, TrillTypeEnum} from '@/enums/musicScoreEnum';
import type {Skin, VDom} from '@/types/common';
import {bravuraLineGlyphs, type BravuraLineGlyph} from '@/skins/generated/bravuraLineGlyphs';
import {useGeometrySkinColor} from './useGeometrySkinColor';

const props = defineProps<{
  vDom: VDom;
  notationType?: MusicScoreTypeEnum;
  skin?: Skin;
}>();

const fillColor = useGeometrySkinColor(
  toRef(props, 'vDom'),
  toRef(props, 'skin'),
  toRef(props, 'notationType'),
);

const type = computed(() => props.vDom.special?.trill?.type ?? TrillTypeEnum.Trill);

const G = bravuraLineGlyphs;
/** start/end 的 y 为波浪线中线；所有字形共用一条基线 */
const BASELINE_OFFSET = -(G.wiggleTrill.y1 + G.wiggleTrill.y2) / 2;

type Placed = { d: string; x: number };

/** 起始符号 + 平铺段；起始符号后至少留一段，放不下就只画起始符号 */
function layout(left: number, right: number): Placed[] {
  const out: Placed[] = [];
  let x = left;
  const push = (g: BravuraLineGlyph) => {
    out.push({d: g.d, x});
    x += g.advance;
  };
  if (type.value === TrillTypeEnum.Trill) {
    push(G.ornamentTrill);
    const n = Math.floor((right - x) / G.wiggleTrill.advance);
    for (let i = 0; i < n; i++) push(G.wiggleTrill);
    return out;
  }
  if (type.value === TrillTypeEnum.Upprall) push(G.ornamentBottomLeftConcaveStroke);
  else if (type.value === TrillTypeEnum.Downprall) push(G.ornamentLeftVerticalStroke);
  const tail = G.ornamentZigZagLineWithRightEnd;
  const n = Math.max(0, Math.floor((right - x - tail.advance) / G.ornamentZigZagLineNoRightEnd.advance));
  for (let i = 0; i < n; i++) push(G.ornamentZigZagLineNoRightEnd);
  push(tail);
  return out;
}

const geom = computed(() => {
  const s = props.vDom.startPoint;
  const e = props.vDom.endPoint;
  return {
    baseline: (s.y + e.y) / 2 + BASELINE_OFFSET,
    glyphs: layout(Math.min(s.x, e.x), Math.max(s.x, e.x)),
  };
});
</script>

<template>
  <g :fill="fillColor">
    <path
      v-for="(g, i) in geom.glyphs"
      :key="i"
      :d="g.d"
      :transform="`translate(${g.x}, ${geom.baseline})`"
    />
  </g>
</template>
