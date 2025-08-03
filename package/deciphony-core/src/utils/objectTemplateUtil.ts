import {
    AccidentalEnum,
    BarLineTypeEnum,
    BeamTypeEnum,
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum,
    MsTypeNameEnum,
    MusicScoreRegionEnum,
    SpanSymbolFollowingCategoryEnum,
    SpanSymbolTypeEnum
} from "../musicScoreEnum.ts";
import {
    BaseMsSymbol,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MultipleStaves,
    SingleStaff,
    SpanSymbol,
    TimeSignature
} from "../../types";
import {judgeDirection} from "./musicScoreDataUtil.ts";

export function spanSymbolTemplate(options: {
    type?: SpanSymbolTypeEnum,
    startTargetId: number,
    endTargetId: number
}): SpanSymbol | null {
    switch (options?.type) {
        case SpanSymbolTypeEnum.volta: {
            return {
                "type": SpanSymbolTypeEnum.volta,
                "msTypeName": MsTypeNameEnum.SpanSymbol,
                "spanSymbolFollowingCategoryEnum": SpanSymbolFollowingCategoryEnum.measure,
                "startTargetId": options.startTargetId,
                "endTargetId": options.endTargetId,
                "id": Date.now(),
                "rect": {
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                },
                "options": {
                    "highlight": false,
                    "highlightColor": "red",
                    "color": "black"
                },
                "vueKey": Date.now()
            }
        }
        case SpanSymbolTypeEnum.slur: {
            return {
                "type": SpanSymbolTypeEnum.slur,
                "msTypeName": MsTypeNameEnum.SpanSymbol,
                "spanSymbolFollowingCategoryEnum": SpanSymbolFollowingCategoryEnum.msSymbol,
                "startTargetId": options.startTargetId,
                "endTargetId": options.endTargetId,
                "id": Date.now(),
                "rect": {
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                },
                "options": {
                    "highlight": false,
                    "highlightColor": "red",
                    "color": "black"
                },
                "vueKey": Date.now()
            }
        }
    }
    return {
        "type": SpanSymbolTypeEnum.volta,
        "msTypeName": MsTypeNameEnum.SpanSymbol,
        "spanSymbolFollowingCategoryEnum": SpanSymbolFollowingCategoryEnum.measure,
        "startTargetId": options.startTargetId,
        "endTargetId": options.endTargetId,
        "id": Date.now(),
        "rect": {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
        },
        "options": {
            "highlight": false,
            "highlightColor": "red",
            "color": "black"
        },
        "vueKey": Date.now()
    }
}

export function msSymbolTemplate(options: {
    type?: MsSymbolTypeEnum,
    region?: MusicScoreRegionEnum,
    chronaxie?: ChronaxieEnum,
    barLineType?: BarLineTypeEnum,
    clef?: ClefEnum,
    keySignature?: KeySignatureEnum,
    timeSignature?: TimeSignature,
    accidental?: AccidentalEnum,
    direction?: 'up' | 'down'
} = {}): MsSymbol {
    const baseMsSymbol: BaseMsSymbol = {
        id: Date.now() + 1,
        msTypeName: MsTypeNameEnum.MsSymbol,
        index: {
            multipleStavesIndex: -1,
            singleStaffIndex: -1,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        },
        options: {
            highlight: false,
            highlightColor: 'red',
            color: 'black',
        },
        bindingStartId: [],
        bindingEndId: [],
        msSymbolArray: [],
        vueKey: Date.now(),
    }
    switch (options.type) {
        case MsSymbolTypeEnum.noteHead: {

            const region = options.region || MusicScoreRegionEnum.space_3
            // chronaxie不存在默认为四分音符，添加符杠
            if (!options.chronaxie || ![ChronaxieEnum.whole].includes(options.chronaxie)) {
                const noteBar = msSymbolTemplate({
                    type: MsSymbolTypeEnum.noteBar,
                    direction: judgeDirection(region),
                })
                baseMsSymbol.msSymbolArray.push(noteBar)

            }
            // 如果不为全，二分，四分音符，添加符尾
            if (options.chronaxie && ![ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter].includes(options.chronaxie)) {

                const noteTail = msSymbolTemplate({
                    type: MsSymbolTypeEnum.noteTail,
                    chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                    direction: judgeDirection(region),
                })
                baseMsSymbol.msSymbolArray.push(noteTail)
            }
            return {
                ...baseMsSymbol,
                beamId: -1,
                type: MsSymbolTypeEnum.noteHead,
                region: region,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
            }
        }
        case MsSymbolTypeEnum.rest: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.rest,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
            }
        }
        case MsSymbolTypeEnum.barLine: {
            const barLineType = options.barLineType ?? BarLineTypeEnum.single
            if (BarLineTypeEnum.endRepeatSign === barLineType || BarLineTypeEnum.startRepeatSign === barLineType) {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.barLine,
                    barLineType: barLineType,
                    loopCount: 2
                }
            } else {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.barLine,
                    barLineType: barLineType
                }
            }

        }

        case MsSymbolTypeEnum.barLine_f: {
            const barLineType = options.barLineType ?? BarLineTypeEnum.single
            if (BarLineTypeEnum.endRepeatSign === barLineType || BarLineTypeEnum.startRepeatSign === barLineType) {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.barLine_f,
                    barLineType: barLineType,
                    loopCount: 2
                }
            } else {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.barLine_f,
                    barLineType: barLineType
                }
            }

        }
        case MsSymbolTypeEnum.noteBar: {
            return {
                ...baseMsSymbol,
                direction: options.direction || 'up',
                type: MsSymbolTypeEnum.noteBar,
            }
        }
        case MsSymbolTypeEnum.noteTail: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.noteTail,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                beamType: BeamTypeEnum.left,
                direction: options.direction || 'up',
            }
        }
        case MsSymbolTypeEnum.clef_f: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.clef_f,
                clef: options.clef || ClefEnum.treble
            }
        }
        case MsSymbolTypeEnum.clef: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.clef,
                clef: options.clef || ClefEnum.treble
            }
        }
        case MsSymbolTypeEnum.keySignature: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.keySignature,
                keySignature: options.keySignature || KeySignatureEnum.C
            }
        }
        case MsSymbolTypeEnum.timeSignature: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.timeSignature,
                timeSignature: options.timeSignature || {
                    beat: 1,
                    chronaxie: 4
                }
            }
        }
        case MsSymbolTypeEnum.accidental: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.accidental,
                accidental: options.accidental || AccidentalEnum.sharp
            }
        }
        default: {
            console.error('type不被识别，符号模版返回noteHead')
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.noteHead,
                region: options.region || MusicScoreRegionEnum.space_3,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                beamId: -1,
            }
        }

    }
}

export function msSymbolContainerTemplate(options: { type?: MsSymbolContainerTypeEnum } = {}): MsSymbolContainer {
    const msSymbolContainer: MsSymbolContainer = {
        id: Date.now() + 2,
        msSymbolArray: [],
        type: options.type || MsSymbolContainerTypeEnum.variable,
        index: {
            multipleStavesIndex: -1,
            singleStaffIndex: -1,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        },
        bindingStartId: [],
        bindingEndId: [],
        options: {
            highlight: false,
            highlightColor: 'red',
            color: 'black',
        },
        vueKey: Date.now(),
        msTypeName: MsTypeNameEnum.MsSymbolContainer,
    }

    return msSymbolContainer;
}

export function measureTemplate(options: { barLineType?: BarLineTypeEnum } = {}): Measure {


    const measure: Measure = {
        id: Date.now() + 3,
        msTypeName: MsTypeNameEnum.Measure,
        index: {
            multipleStavesIndex: -1,
            singleStaffIndex: -1,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        },
        bindingStartId: [],
        bindingEndId: [],
        options: {
            highlight: false,
            highlightColor: 'red',
            color: 'black',
        },
        vueKey: Date.now(),
        msSymbolContainerArray: []
    }
    // 小节必须有结束小节线
    const barLine: MsSymbol = msSymbolTemplate({
        type: MsSymbolTypeEnum.barLine,
        barLineType: options.barLineType || BarLineTypeEnum.single
    });
    const container = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.rearFixed})
    container.msSymbolArray.push(barLine)
    measure.msSymbolContainerArray.push(container)


    return measure;
}

// 会默认添加一个小节
export function singleStaffTemplate(options: {} = {}): SingleStaff {
    const singleStaff: SingleStaff = {
        id: Date.now() + 4,
        msTypeName: MsTypeNameEnum.SingleStaff,
        index: {
            multipleStavesIndex: -1,
            singleStaffIndex: -1,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        },
        bindingStartId: [],
        bindingEndId: [],
        singleStaffPaddingTop: 30,
        singleStaffPaddingBottom: 30,
        options: {
            highlight: false,
            highlightColor: 'red',
            color: 'transparent',
        },
        vueKey: Date.now(),
        singleStaffMarginBottom: 30,
        measureArray: []
    }
    const measure = measureTemplate({})
    singleStaff.measureArray.push(measure)


    return singleStaff;
}

// 会默认添加一个带小节的单谱表
export function multipleStavesTemplate(options: {} = {}): MultipleStaves {
    const multipleStaves: MultipleStaves = {
        id: Date.now() + 5,
        msTypeName: MsTypeNameEnum.MultipStaves,
        index: {
            multipleStavesIndex: -1,
            singleStaffIndex: -1,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1,
        },
        bindingStartId: [],
        bindingEndId: [],
        multipleStavesPaddingTop: 60,
        multipleStavesPaddingBottom: 60,
        multipleStavesMarginBottom: 60,
        options: {
            highlight: false,
            highlightColor: 'red',
            color: 'transparent',
        },
        vueKey: Date.now(),
        singleStaffArray: []
    }
    const singleStaff = singleStaffTemplate({})
    multipleStaves.singleStaffArray.push(singleStaff)


    return multipleStaves;
}