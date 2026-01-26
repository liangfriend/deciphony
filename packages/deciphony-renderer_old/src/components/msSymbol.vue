<script lang="ts" setup>
import {computed, CSSProperties, inject, onMounted, PropType, Ref, ref, watch} from "vue";
import {
    AccidentalEnum,
    BarLineTypeEnum,
    ChronaxieEnum,
    type Measure,
    MsSymbol,
    type MsSymbolContainer,
    MsSymbolTypeEnum,
    type MusicScore,
    MusicScoreShowModeEnum,
    NoteHead,
    type SingleStaff,
    SolmizationEnum
} from "deciphony-core";
import {getMsSymbolAspectRatio} from "@/utils/geometryUtil";
import {getMsSymbolHeight} from "@/utils/heightUtil";
import {getMsSymbolWidth} from "@/utils/widthUtil";
import {getMsSymbolLeftToSlot} from "@/utils/leftUtil";
import {getMsSymbolTopToSlot} from "@/utils/topUtil";
import {MsState} from "@/types";
import NoteTail from "@/components/noteTail.vue";
import TimeSignature from "@/components/timeSignature.vue";
import KeySignature from "@/components/keySignature.vue";
import Clef from "@/components/clef.vue";


const props = defineProps({
    msSymbol: {
        type: Object as PropType<MsSymbol>,
        required: true
    },
    msSymbolContainer: {
        type: Object as PropType<MsSymbolContainer>,
        required: true,
    },
    preContainer: {
        type: Object as PropType<MsSymbolContainer | null>,
    },
    nextContainer: {
        type: Object as PropType<MsSymbolContainer | null>,
    },
    measure: {
        type: Object as PropType<Measure>,
        required: true
    },
    measureWidth: {
        type: Number,
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
    containerWidth: {
        type: Number,
        required: true
    },
    isMain: {
        type: Boolean,
        default: false,
    },
    //小节高度， 此属性会控制音符，休止符，谱号，拍号等符号大小
    measureHeight: {
        type: Number,
        required: true
    },
    parentMsSymbol: {
        type: Object as PropType<MsSymbol>,
    },
    // 符号槽位宽度（父级符号宽度）
    slotWidth: {
        type: Number,
        required: true
    },
    slotTop: {
        type: Number,
        required: true
    },
    slotLeft: {
        type: Number,
        required: true
    },
    componentWidth: {
        type: Number,
        required: true
    },
    componentHeight: {
        type: Number,
        required: true
    },

})
// 皮肤
// 皮肤
const {svgSkin, isOriginSkin} = inject("skin") as {
    isOriginSkin: Ref<boolean>,
    svgSkin: Ref<Record<string, { url: string; }>>
}

watch(() => props.msSymbol?.vueKey, () => {
    getSvgHref()
})

function getSvgHref(): string {
    switch (props.msSymbol?.type) {
        case MsSymbolTypeEnum.NoteHead: {
            switch (props.msSymbol?.chronaxie) {
                case ChronaxieEnum.whole: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_noteHead_1.url : svgSkin.value.noteHead_1.url
                }
                case ChronaxieEnum.half: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_noteHead_2.url : svgSkin.value.noteHead_2.url
                }
                case ChronaxieEnum.quarter: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_noteHead_4.url : svgSkin.value.noteHead_4.url
                }
                default: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_noteHead_4.url : svgSkin.value.noteHead_4.url
                }
            }
        }
        case MsSymbolTypeEnum.Rest: {
            switch (props.msSymbol?.chronaxie) {
                case ChronaxieEnum.whole: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_1.url : svgSkin.value.rest_1.url
                }
                case ChronaxieEnum.half: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_2.url : svgSkin.value.rest_2.url
                }
                case ChronaxieEnum.quarter: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_4.url : svgSkin.value.rest_4.url
                }
                case ChronaxieEnum.eighth: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_8.url : svgSkin.value.rest_8.url
                }
                case ChronaxieEnum.sixteenth: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_16.url : svgSkin.value.rest_16.url
                }
                case ChronaxieEnum.thirtySecond: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_32.url : svgSkin.value.rest_32.url
                }
                case ChronaxieEnum.sixtyFourth: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_64.url : svgSkin.value.rest_64.url
                }
                case ChronaxieEnum.oneTwentyEighth: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_128.url : svgSkin.value.rest_128.url
                }
                case ChronaxieEnum.twoFiftySixth: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_256.url : svgSkin.value.rest_256.url
                }
                default: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_rest_4.url : svgSkin.value.rest_4.url
                }

            }
        }
        case MsSymbolTypeEnum.NoteStem: {
            return props.msSymbol.options.highlight ? svgSkin.value.active_noteStem.url : svgSkin.value.noteStem.url
        }
        case MsSymbolTypeEnum.NoteTail: {
            return ''
        }
        case MsSymbolTypeEnum.Clef: {
            return ''
        }
        case MsSymbolTypeEnum.Clef_f: {
            return ''
        }
        case MsSymbolTypeEnum.BarLine: {
            switch (props.msSymbol?.barLineType) {
                case BarLineTypeEnum.single: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barline_single.url : svgSkin.value.barline_single.url
                }
                case BarLineTypeEnum.final: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barLine_final.url : svgSkin.value.barLine_final.url
                }
                case BarLineTypeEnum.reverseFinal: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barline_reverseFinal.url : svgSkin.value.barline_reverseFinal.url
                }
                case BarLineTypeEnum.startRepeatSign: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barline_startRepeatSign.url : svgSkin.value.barline_startRepeatSign.url
                }
                case BarLineTypeEnum.endRepeatSign: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barLine_endRepeatSign.url : svgSkin.value.barLine_endRepeatSign.url
                }

            }

            return ''
        }
        case MsSymbolTypeEnum.BarLine_f: {
            switch (props.msSymbol?.barLineType) {
                case BarLineTypeEnum.single: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barline_single.url : svgSkin.value.barline_single.url
                }
                case BarLineTypeEnum.final: {
                    return props.msSymbol.options.highlight ? svgSkin.value.activebarLine_final.url : svgSkin.value.barLine_final.url
                }
                case BarLineTypeEnum.reverseFinal: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barline_reverseFinal.url : svgSkin.value.barline_reverseFinal.url
                }
                case BarLineTypeEnum.startRepeatSign: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barline_startRepeatSign.url : svgSkin.value.barline_startRepeatSign.url
                }
                case BarLineTypeEnum.endRepeatSign: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_barLine_endRepeatSign.url : svgSkin.value.barLine_endRepeatSign.url
                }
            }
            console.error("未知的小节线类型", props.msSymbol)
            return ''
        }
        case MsSymbolTypeEnum.KeySignature: {
            return ''
        }
        case MsSymbolTypeEnum.TimeSignature: {
            return ''
        }
        case MsSymbolTypeEnum.Accidental: {
            switch (props.msSymbol?.accidental) {
                case AccidentalEnum.Sharp: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_accidental_sharp.url : svgSkin.value.accidental_sharp.url
                }
                case AccidentalEnum.Flat: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_accidental_flat.url : svgSkin.value.accidental_flat.url
                }
                case AccidentalEnum.Natural: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_accidental_nature.url : svgSkin.value.accidental_nature.url
                }
                case AccidentalEnum.DoubleSharp: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_accidental_doubleSharp.url : svgSkin.value.accidental_doubleSharp.url
                }
                case AccidentalEnum.DoubleFlat: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_accidental_doubleFlat.url : svgSkin.value.accidental_doubleFlat.url
                }

            }
            console.error("未知的变音符号", props.msSymbol)
            return ''
        }
        case MsSymbolTypeEnum.NoteNumber: {
            switch (props.msSymbol?.solmization) {
                case SolmizationEnum.DO: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_1.url : svgSkin.value.number_1.url
                }
                case SolmizationEnum.RE: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_2.url : svgSkin.value.number_2.url
                }
                case SolmizationEnum.MI: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_3.url : svgSkin.value.number_3.url
                }
                case SolmizationEnum.FA: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_4.url : svgSkin.value.number_4.url
                }
                case SolmizationEnum.SOL: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_5.url : svgSkin.value.number_5.url
                }
                case SolmizationEnum.LA: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_6.url : svgSkin.value.number_6.url
                }
                case SolmizationEnum.TI: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_7.url : svgSkin.value.number_7.url
                }
                default: {
                    return props.msSymbol.options.highlight ? svgSkin.value.active_number_1.url : svgSkin.value.number_1.url
                }

            }
        }
        case MsSymbolTypeEnum.NoteDot: {
            switch (props.msSymbol.octave) {
                case 0: {
                    return svgSkin.value.noteDot_4.url
                }
                case 1: {
                    return svgSkin.value.noteDot_3.url
                }
                case 2: {
                    return svgSkin.value.noteDot_2.url
                }
                case 3: {
                    return svgSkin.value.noteDot_1.url
                }
                case 5: {
                    return svgSkin.value.noteDot_1.url
                }
                case 6: {
                    return svgSkin.value.noteDot_2.url
                }
                case 7: {
                    return svgSkin.value.noteDot_3.url
                }
                case 8: {
                    return svgSkin.value.noteDot_4.url
                }
                default: {
                    return ''
                }
            }
        }
        case MsSymbolTypeEnum.ChronaxieReducingLine: {
            switch (props.msSymbol.chronaxie) {
                case ChronaxieEnum.eighth: {
                    return svgSkin.value.chronaxieReducingLine_1.url
                }
                case ChronaxieEnum.sixteenth: {
                    return svgSkin.value.chronaxieReducingLine_2.url
                }
                case ChronaxieEnum.thirtySecond: {
                    return svgSkin.value.chronaxieReducingLine_3.url
                }
                case ChronaxieEnum.sixtyFourth: {
                    return svgSkin.value.chronaxieReducingLine_4.url
                }

                default: {
                    return ''
                }
            }
        }
        case MsSymbolTypeEnum.ChronaxieIncreasingLine: {
            return props.msSymbol.options.highlight ? svgSkin.value.active_chronaxieIncreasingLine.url : svgSkin.value.chronaxieIncreasingLine.url
        }

        default: {
            console.error("未知的符号类别", props.msSymbol)
            return ''
        }
    }
}

const svgHref = computed(() => {
    return getSvgHref()

})
const msSymbolRef = ref(null!)

const aspectRatio = computed<number>(() => {
    return getMsSymbolAspectRatio(props.msSymbol)
})


const height = computed(() => {
    // const parentMsSymbol = getDataWithIndex(props.msSymbol).msSymbol
    return getMsSymbolHeight(props.msSymbol, props.musicScore)
})
// 符号宽度
const width = computed(() => {
    return getMsSymbolWidth(props.msSymbol, props.msSymbolContainer, props.measure,
        props.singleStaff, props.musicScore, props.componentWidth,)
})
const msSymbolLeft = computed(() => {
    return getMsSymbolLeftToSlot(props.msSymbol, props.msSymbolContainer, props.measure, props.singleStaff, props.musicScore, props.slotLeft, props.measureWidth, props.componentWidth)
})

const msSymbolTop = computed(() => {
    return getMsSymbolTopToSlot(props.msSymbol, props.musicScore)

})
const msSymbolStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        width: `${width.value}px`,
        height: `${height.value}px`,
        position: 'absolute',
        pointerEvents: 'auto',
        left: msSymbolLeft.value + 'px',
        top: msSymbolTop.value + 'px',
    }
    if (props.msSymbol?.type && [MsSymbolTypeEnum.KeySignature, MsSymbolTypeEnum.TimeSignature,
        MsSymbolTypeEnum.NoteTail].includes(props.msSymbol.type)) {
        style.background = 'unset'
    }

    if (svgHref.value && isOriginSkin) {
        style.mask = `url("${svgHref.value}") no-repeat center`
        style['mask-size'] = '100% 100%'
        style.backgroundColor = props.msSymbol.options.highlight ? props.msSymbol.options.highlightColor : props.msSymbol.options.color
    }

    return style
});
const emits = defineEmits(['msSymbolMouseDown', 'msSymbolMouseUp']);

function handleMouseDown(e: MouseEvent) {
    emits('msSymbolMouseDown', e, props.msSymbol)

}

function handleMouseUp(e: MouseEvent) {
    emits('msSymbolMouseUp', e, props.msSymbol)
}


onMounted(() => {

})
defineExpose({aspectRatio})
</script>
<template>
    <clef
        v-if="msSymbol?.type === MsSymbolTypeEnum.Clef || msSymbol?.type === MsSymbolTypeEnum.Clef_f && 'clef' in msSymbol"
        v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
        :clef="msSymbol"
        :musicScore="musicScore"
        :style="msSymbolStyle"
        @mouseup.self="handleMouseUp"
        @mousedown.self="handleMouseDown"></clef>
    <key-signature
        v-else-if="msSymbol?.type === MsSymbolTypeEnum.KeySignature"
        v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
        :keySignature="msSymbol"
        :measure-height="measureHeight"
        :musicScore="musicScore"
        :slotWidth="slotWidth"
        :style="msSymbolStyle"
        @mouseup.self="handleMouseUp"
        @mousedown.self="handleMouseDown"></key-signature>
    <time-signature
        v-else-if="msSymbol?.type === MsSymbolTypeEnum.TimeSignature"
        v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
        :measure-height="measureHeight"
        :style="msSymbolStyle"
        :time-signature="msSymbol"
        @mouseup.self="handleMouseUp" @mousedown.self="handleMouseDown"></time-signature>
    <note-tail
        v-else-if="msSymbol?.type === MsSymbolTypeEnum.NoteTail"
        v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
        :component-width="componentWidth"
        :measure="measure"
        :measure-width="measureWidth"
        :ms-symbol-container="msSymbolContainer"
        :musicScore="musicScore"
        :next-container="nextContainer?nextContainer:null"
        :noteHead="parentMsSymbol as NoteHead"
        :noteTail="msSymbol" :pre-container="preContainer?preContainer:null" :single-staff="singleStaff"
        :slot-left="slotLeft"></note-tail>

    <div v-else-if="msSymbol?.type === MsSymbolTypeEnum.NoteStem && isOriginSkin"
         v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
         ref="msSymbolRef" :style="msSymbolStyle" class="msSymbol" @mouseup.self="handleMouseUp"
         @mousedown.self="handleMouseDown"
    ></div>
    <img v-else-if="msSymbol?.type === MsSymbolTypeEnum.NoteStem"
         v-show="musicScore.showMode === MusicScoreShowModeEnum.standardStaff"
         ref="msSymbolRef"
         :src="svgHref" :style="msSymbolStyle" class="msSymbol" @mouseup.self="handleMouseUp"
         @mousedown.self="handleMouseDown"
    />
    <div v-else-if="isOriginSkin" ref="msSymbolRef" :src="svgHref" :style="msSymbolStyle" class="msSymbol"
         @mouseup.self="handleMouseUp"
         @mousedown.self="handleMouseDown"
    ></div>
    <img v-else ref="msSymbolRef" :src="svgHref" :style="msSymbolStyle" class="msSymbol" @mouseup.self="handleMouseUp"
         @mousedown.self="handleMouseDown"
    />
</template>
<style scoped>
.msSymbol {
    pointer-events: all;
}
</style>