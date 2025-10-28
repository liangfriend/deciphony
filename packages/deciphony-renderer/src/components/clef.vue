<script lang="ts" setup>
import {ClefEnum} from "../../../deciphony-core/src/musicScoreEnum";
import {computed, CSSProperties, inject, PropType, Ref} from "vue";
import {ClefMsSymbol, MusicScore} from "../../../deciphony-core/src/types";

const props = defineProps({
    clef: {
        type: Object as PropType<ClefMsSymbol>,
        required: true
    },
    musicScore: {
        required: true,
        type: Object as PropType<MusicScore>,
    }
})
// 皮肤
const {svgSkin, isOriginSkin} = inject("skin") as {
    isOriginSkin: Ref<boolean>,
    svgSkin: Ref<Record<string, { url: string; }>>
}
const svgHref = computed(() => {
    let svgUrl = ''
    if (props.clef.clef === ClefEnum.Treble) {
        svgUrl = svgSkin.value.clef_treble.url
    } else if (props.clef.clef === ClefEnum.Alto) {
        svgUrl = svgSkin.value.clef_alto.url
    } else if (props.clef.clef === ClefEnum.Bass) {
        svgUrl = svgSkin.value.clef_bass.url
    }
    return svgUrl
})
const clefStyle = computed(() => {
    const res: CSSProperties = {}
    if (isOriginSkin.value) {
        res.mask = `url("${svgHref.value}") center center / 100% 100% no-repeat`
        res.backgroundColor = props.clef?.options.highlight ? props.clef?.options.highlightColor : props.clef?.options.color
    }
    return res
})
</script>


<template>
    <div v-if="isOriginSkin" :style="clefStyle" comment="谱号"></div>
    <img v-else :src="svgHref" comment="谱号"/>
</template>

<style scoped>

</style>