<script lang="ts" setup>
import {computed, CSSProperties, inject, PropType, Ref} from "vue";
import {getBeamGroup,} from "deciphony-core";
import {
    BeamGroup,
    type Measure,
    MsSymbol,
    type MsSymbolContainer,
    type MusicScore,
    NoteHead,
    NoteTail,
    type SingleStaff
} from "../../../deciphony-core/src/types";
import {ChronaxieEnum, MsSymbolTypeEnum} from "../../../deciphony-core/src/musicScoreEnum";


import {getMsSymbolHeight} from "../utils/heightUtil";
import {getMsSymbolWidth, getNoteTailWidth} from "../utils/widthUtil";
import {getMsSymbolLeftToSlot} from "../utils/leftUtil";
import {getMsSymbolTopToSlot} from "../utils/topUtil";
import {getMsSymbolAspectRatio} from "../utils/geometryUtil";


const props = defineProps({
    noteTail: {
        type: Object as PropType<NoteTail>,
        required: true
    },
    // 不知道这里是否有问题，外部使用了as进行了强转，定性了符杠的父符号只能是符头
    noteHead: {
        type: Object as PropType<NoteHead>,
        required: true
    },
    preContainer: {
        type: Object as PropType<MsSymbolContainer | undefined>,
        required: true
    },
    nextContainer: {
        type: Object as PropType<MsSymbolContainer | undefined>,
        required: true
    },
    msSymbolContainer: {
        type: Object as PropType<MsSymbolContainer>,
        required: true,
    },
    measure: {
        type: Object as PropType<Measure>,
        required: true
    },
    singleStaff: {
        type: Object as PropType<SingleStaff>,
        required: true
    },
    musicScore: {
        type: Object as PropType<MusicScore>,
        required: true
    },

    parentMsSymbol: {
        type: Object as PropType<MsSymbol>,
    },
    slotLeft: {
        type: Number,
        required: true
    },
    measureWidth: {
        type: Number,
        required: true
    },
    componentWidth: {
        type: Number,
        required: true
    },

})
// 皮肤
const {svgSkin, isOriginSkin} = inject("skin") as {
    isOriginSkin: Ref<boolean>,
    svgSkin: Ref<Record<string, { url: string; }>>
}
const beamGroup = computed((): BeamGroup => {
    return getBeamGroup(props.noteHead.beamId, props.measure)
})

const aspectRatio = computed<number>(() => {
    return getMsSymbolAspectRatio(props.noteTail)
})
// 符尾条数
const tailCount = computed(() => {
    switch (props.noteTail?.chronaxie) {
        case ChronaxieEnum.eighth:
            return 1
        case ChronaxieEnum.sixteenth:
            return 2
    }
    return 0
})


const height = computed(() => {
    // const parentMsSymbol = getDataWithIndex(props.msSymbol).msSymbol
    return getMsSymbolHeight(props.noteTail, props.musicScore)
})
// 符号宽度
const width = computed(() => {
    // TODO 补全如果是成组的才这样做
    if (props.noteTail.type === MsSymbolTypeEnum.NoteTail && props.nextContainer) {
        return getNoteTailWidth(props.noteTail, props.noteHead, props.msSymbolContainer,
            props.measure, props.singleStaff, props.musicScore,
            props.componentWidth)
    }
    return getMsSymbolWidth(props.noteTail, props.msSymbolContainer, props.measure,
        props.singleStaff, props.musicScore, props.componentWidth)
})
const msSymbolStyle = computed<CSSProperties>(() => {

    const style: CSSProperties = {
        width: `${width.value}px`,
        height: `${height.value}px`,
        display: 'flex',
        flexDirection: props.noteTail?.direction === 'up' ? 'column' : 'column-reverse',
        position: 'absolute',
        left: msSymbolLeft.value + 'px',
        top: msSymbolTop.value + 'px',
        background: props.noteTail.options.highlight ? props.noteTail.options.highlightColor : props.noteTail.options.color,
    }

    if (mask.value && beamGroup.value.length < 2) {
        style.mask = `url("${mask.value}") center center / cover no-repeat`
        if (props.noteTail?.direction === 'down') {
            style.transform = 'scaleY(-1)' // 垂直翻转
        }
    } else {
        style.background = 'transparent'
    }

    return style
});
const msSymbolLeft = computed(() => {
    return getMsSymbolLeftToSlot(props.noteTail, props.msSymbolContainer, props.measure, props.singleStaff,
        props.musicScore, props.slotLeft, props.measureWidth, props.componentWidth)
})

const msSymbolTop = computed(() => {
    return getMsSymbolTopToSlot(props.noteTail, props.musicScore)

})
const mask = computed(() => {
    switch (props.noteTail.chronaxie) {
        case ChronaxieEnum.eighth: {
            return props.noteTail.options.highlight ? svgSkin.value.active_noteTail_8.url : svgSkin.value.noteTail_8.url
        }
        case ChronaxieEnum.sixteenth: {
            return props.noteTail.options.highlight ? svgSkin.value.active_noteTail_16.url : svgSkin.value.noteTail_16.url
        }
        case ChronaxieEnum.thirtySecond: {
            return props.noteTail.options.highlight ? svgSkin.value.active_noteTail_32.url : svgSkin.value.noteTail_32.url
        }
        case ChronaxieEnum.sixtyFourth: {
            return props.noteTail.options.highlight ? svgSkin.value.active_noteTail_64.url : svgSkin.value.noteTail_64.url
        }
        case ChronaxieEnum.oneTwentyEighth: {
            return props.noteTail.options.highlight ? svgSkin.value.active_noteTail_128.url : svgSkin.value.noteTail_128.url
        }
        case ChronaxieEnum.twoFiftySixth: {
            return props.noteTail.options.highlight ? svgSkin.value.active_noteTail_256.url : svgSkin.value.noteTail_256.url
        }
        default: {
            return ''
        }
    }

})


</script>

<template>
    <div v-if="isOriginSkin" :style="msSymbolStyle">

    </div>
    <img v-else :src="mask" :style="msSymbolStyle"/>

    <!--  TODO 这里后续要改掉，使用svg的形式控制连符杠  -->
    <template v-if="beamGroup.length > 1">
        <div v-for="(item,index) in tailCount*2-1"
             :style="{backgroundColor:index%2===0?'black':'transparent',height:(height / 5)+'px',width:'100%',}">
        </div>
    </template>
</template>

<style scoped>

</style>