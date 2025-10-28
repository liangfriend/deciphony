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
    MusicScoreShowModeEnum,
    SolmizationEnum,
    SpanSymbolFollowingCategoryEnum,
    SpanSymbolTypeEnum,
    StaffPositionTypeEnum,
    StaffRegionEnum
} from "../musicScoreEnum";
import {
    BaseMsSymbol,
    ChronaxieReducingLine,
    ChronaxieIncreasingLine,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MultipleStaves,
    MusicScore,
    NoteDot,
    NoteNumber,
    SingleStaff,
    SpanSymbol,
    StaffRegion,
    TimeSignature
} from "../types";
import {judgeDirection, staffRegionToIndex} from "./musicScoreDataUtil";

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
                "id": Math.random() * Date.now(),
                "options": {
                    "highlight": false,
                    "highlightColor": "red",
                    "color": "transparent",
                    offset: {
                        startPoint: {
                            x: 0,
                            y: 0,
                        },
                        endPoint: {
                            x: 0,
                            y: 0,
                        },
                    },
                },
                "vueKey": Math.random() * Date.now()
            }
        }
        case SpanSymbolTypeEnum.slur: {
            return {
                "type": SpanSymbolTypeEnum.slur,
                "msTypeName": MsTypeNameEnum.SpanSymbol,
                "spanSymbolFollowingCategoryEnum": SpanSymbolFollowingCategoryEnum.msSymbol,
                "startTargetId": options.startTargetId,
                "endTargetId": options.endTargetId,
                "id": Math.random() * Date.now(),

                "options": {
                    "highlight": false,
                    "highlightColor": "red",
                    "color": "transparent",
                    offset: {
                        startPoint: {
                            x: 0,
                            y: 0,
                        },
                        endPoint: {
                            x: 0,
                            y: 0,
                        },
                        leftSlope: {
                            x: 0,
                            y: 0,
                        },
                        rightSlope: {
                            x: 0,
                            y: 0,
                        },
                    },
                },
                "vueKey": Math.random() * Date.now()
            }
        }
    }
    return {
        "type": SpanSymbolTypeEnum.volta,
        "msTypeName": MsTypeNameEnum.SpanSymbol,
        "spanSymbolFollowingCategoryEnum": SpanSymbolFollowingCategoryEnum.measure,
        "startTargetId": options.startTargetId,
        "endTargetId": options.endTargetId,
        "id": Math.random() * Date.now(),

        "options": {
            "highlight": false,
            "highlightColor": "red",
            "color": "transparent",
            offset: {
                startPoint: {
                    x: 0,
                    y: 0,
                },
                endPoint: {
                    x: 0,
                    y: 0,
                },
            },
        },
        "vueKey": Math.random() * Date.now()
    }
}

export function msSymbolTemplate(options: {
    type?: MsSymbolTypeEnum,
    region?: StaffRegion,
    chronaxie?: ChronaxieEnum,
    barLineType?: BarLineTypeEnum,
    clef?: ClefEnum,
    keySignature?: KeySignatureEnum,
    timeSignature?: TimeSignature,
    accidental?: AccidentalEnum,
    direction?: 'up' | 'down',
    octave?: number,
    solmization?: SolmizationEnum,
} = {}): MsSymbol {
    const baseMsSymbol: BaseMsSymbol = {
        id: Math.random() * Date.now() + 1,
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
        vueKey: Math.random() * Date.now(),
    }
    switch (options.type) {
        case MsSymbolTypeEnum.NoteHead: {

            const region = options.region || {
                region: StaffRegionEnum.Main,
                type: StaffPositionTypeEnum.Line,
                index: 1
            }
            // chronaxie不存在默认为四分音符，添加符杠
            if (!options.chronaxie || ![ChronaxieEnum.whole].includes(options.chronaxie)) {
                const noteStem = msSymbolTemplate({
                    type: MsSymbolTypeEnum.NoteStem,
                    direction: judgeDirection(staffRegionToIndex(region)),
                })
                baseMsSymbol.msSymbolArray.push(noteStem)

            }
            // 如果不为全，二分，四分音符，添加符尾
            if (options.chronaxie && ![ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter].includes(options.chronaxie)) {

                const noteTail = msSymbolTemplate({
                    type: MsSymbolTypeEnum.NoteTail,
                    chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                    direction: judgeDirection(region),
                })
                baseMsSymbol.msSymbolArray.push(noteTail)
            }
            return {
                ...baseMsSymbol,
                beamId: -1,
                type: MsSymbolTypeEnum.NoteHead,
                region: region,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
            }
        }
        case MsSymbolTypeEnum.NoteDot: {
            const noteDot: NoteDot = {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.NoteDot,
                octave: options.octave ?? 4
            }
            return noteDot
        }
        case MsSymbolTypeEnum.NoteNumber: {
            if (options.chronaxie && [ChronaxieEnum.whole, ChronaxieEnum.half].includes(options.chronaxie)) {
                console.error("noteNumber的时值最大为四分音符")
                options.chronaxie = ChronaxieEnum.quarter
            }
            const noteNumber: NoteNumber = {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.NoteNumber,
                solmization: options.solmization || SolmizationEnum.DO,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                octave: options.octave ?? 4,
                beamId: -1
            }

            // 如果不为全，二分，四分音符，添加时值线
            if (options.chronaxie && ![ChronaxieEnum.quarter].includes(options.chronaxie)) {

                const chronaxieReducingLine = msSymbolTemplate({
                    type: MsSymbolTypeEnum.ChronaxieReducingLine,
                    chronaxie: options.chronaxie,
                })
                // 这种还没有绑定到musicScore的不需要使用changeData中的函数
                baseMsSymbol.msSymbolArray.push(chronaxieReducingLine)
            }
            return noteNumber
        }
        case MsSymbolTypeEnum.ChronaxieIncreasingLine: {
            const chronaxieIncreasingLine: ChronaxieIncreasingLine = {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.ChronaxieIncreasingLine,
            }
            return chronaxieIncreasingLine
        }
        case MsSymbolTypeEnum.ChronaxieReducingLine: {
            const chronaxieReducingLine: ChronaxieReducingLine = {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.ChronaxieReducingLine,
                chronaxie: options.chronaxie ?? ChronaxieEnum.eighth
            }
            return chronaxieReducingLine
        }
        case MsSymbolTypeEnum.Rest: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.Rest,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
            }
        }
        case MsSymbolTypeEnum.BarLine: {
            const barLineType = options.barLineType ?? BarLineTypeEnum.single
            if (BarLineTypeEnum.endRepeatSign === barLineType || BarLineTypeEnum.startRepeatSign === barLineType) {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.BarLine,
                    barLineType: barLineType,
                    loopCount: 2
                }
            } else {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.BarLine,
                    barLineType: barLineType
                }
            }

        }

        case MsSymbolTypeEnum.BarLine_f: {
            const barLineType = options.barLineType ?? BarLineTypeEnum.single
            if (BarLineTypeEnum.endRepeatSign === barLineType || BarLineTypeEnum.startRepeatSign === barLineType) {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.BarLine_f,
                    barLineType: barLineType,
                    loopCount: 2
                }
            } else {
                return {
                    ...baseMsSymbol,
                    type: MsSymbolTypeEnum.BarLine_f,
                    barLineType: barLineType
                }
            }

        }
        case MsSymbolTypeEnum.NoteStem: {
            return {
                ...baseMsSymbol,
                direction: options.direction || 'up',
                type: MsSymbolTypeEnum.NoteStem,
            }
        }
        case MsSymbolTypeEnum.NoteTail: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.NoteTail,
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                beamType: BeamTypeEnum.left,
                direction: options.direction || 'up',
            }
        }
        case MsSymbolTypeEnum.Clef_f: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.Clef_f,
                clef: options.clef || ClefEnum.Treble
            }
        }
        case MsSymbolTypeEnum.Clef: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.Clef,
                clef: options.clef || ClefEnum.Treble
            }
        }
        case MsSymbolTypeEnum.KeySignature: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.KeySignature,
                keySignature: options.keySignature || KeySignatureEnum.C
            }
        }
        case MsSymbolTypeEnum.TimeSignature: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.TimeSignature,
                timeSignature: options.timeSignature || {
                    beat: 1,
                    chronaxie: 4
                }
            }
        }
        case MsSymbolTypeEnum.Accidental: {
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.Accidental,
                accidental: options.accidental || AccidentalEnum.Sharp
            }
        }
        default: {
            console.error('type不被识别，符号模版返回noteHead')
            return {
                ...baseMsSymbol,
                type: MsSymbolTypeEnum.NoteHead,
                region: options.region || {
                    region: StaffRegionEnum.Main,
                    type: StaffPositionTypeEnum.Line,
                    index: 1
                },
                chronaxie: options.chronaxie || ChronaxieEnum.quarter,
                beamId: -1,
            }
        }

    }
}

export function msSymbolContainerTemplate(options: { type?: MsSymbolContainerTypeEnum } = {}): MsSymbolContainer {
    const msSymbolContainer: MsSymbolContainer = {
        id: Math.random() * Date.now() + 2,
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
            color: 'transparent',
        },
        vueKey: Math.random() * Date.now(),
        msTypeName: MsTypeNameEnum.MsSymbolContainer,
    }

    return msSymbolContainer;
}

export function measureTemplate(options: { barLineType?: BarLineTypeEnum } = {}): Measure {


    const measure: Measure = {
        id: Math.random() * Date.now() + 3,
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
        vueKey: Math.random() * Date.now(),
        msSymbolContainerArray: []
    }
    // 小节必须有结束小节线
    const barLine: MsSymbol = msSymbolTemplate({
        type: MsSymbolTypeEnum.BarLine,
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
        id: Math.random() * Date.now() + 4,
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
        vueKey: Math.random() * Date.now(),
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
        id: Math.random() * Date.now() + 5,
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
        vueKey: Math.random() * Date.now(),
        singleStaffArray: []
    }
    const singleStaff = singleStaffTemplate({})
    multipleStaves.singleStaffArray.push(singleStaff)


    return multipleStaves;
}

// 返回空musicScore
export function musicScoreTemplate(options: {} = {}) {
    const multipleStaves = multipleStavesTemplate({})
    const musicScore: MusicScore = {
        title: '空曲谱',
        multipleStavesArray: [multipleStaves],
        measureHeight: 60,
        showMode: MusicScoreShowModeEnum.standardStaff,
        spanSymbolArray: [],
        widthDynamicRatio: 0.6,
        map: {},
        vueKey: Math.random() * Date.now() + 6,
        style: null
    }
    return musicScore
}