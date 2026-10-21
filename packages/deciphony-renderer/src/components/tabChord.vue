<script lang="ts" setup>
import {computed, inject, toRef} from 'vue';
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum';
import Chord from './chord.vue';
import type {Skin, VDom} from '@/types/common';
import {useGeometrySkinColor} from './useGeometrySkinColor';
import {SCORE_LAYER_CONTEXT} from '@/render/incremental/layerContext';

const props = defineProps<{
  vDom: VDom;
  notationType?: MusicScoreTypeEnum;
  skin?: Skin;
}>();

const ctx = inject(SCORE_LAYER_CONTEXT, null);

const color = useGeometrySkinColor(
  toRef(props, 'vDom'),
  toRef(props, 'skin'),
  toRef(props, 'notationType'),
);

const chordData = computed(() => props.vDom.special?.tabChord);
const onlyChordName = computed(() => ctx?.options.value.onlyChordName ?? false);
</script>

<template>
  <Chord v-if="chordData" v-bind="chordData" :color="color" :only-chord-name="onlyChordName" />
</template>
