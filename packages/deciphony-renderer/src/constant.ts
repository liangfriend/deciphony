// 宽度占比常数。与MsSymbolTypeEnum组合使用
import {
    AccidentalEnum,
    BarLineTypeEnum,
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolCategoryEnum,
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum
} from "deciphony-core";
import {MsSymbolInformation} from "@/types";


export const KeySignatureTonicSemitones: Record<KeySignatureEnum, number> = {
    [KeySignatureEnum.Cb]: 11,  // B
    [KeySignatureEnum.Gb]: 6,   // Gb
    [KeySignatureEnum.Db]: 1,   // Db
    [KeySignatureEnum.Ab]: 8,   // Ab
    [KeySignatureEnum.Eb]: 3,   // Eb
    [KeySignatureEnum.Bb]: 10,  // Bb
    [KeySignatureEnum.F]: 5,    // F
    [KeySignatureEnum.C]: 0,    // C
    [KeySignatureEnum.G]: 7,    // G
    [KeySignatureEnum.D]: 2,    // D
    [KeySignatureEnum.A]: 9,    // A
    [KeySignatureEnum.E]: 4,    // E
    [KeySignatureEnum.B]: 11,   // B
    [KeySignatureEnum['F#']]: 6,   // F#
    [KeySignatureEnum['C#']]: 1    // C#
};


export const MsSymbolInformationMap: Record<MsSymbolTypeEnum, MsSymbolInformation> = {
    [MsSymbolTypeEnum.NoteHead]:
        {
            containerType: MsSymbolContainerTypeEnum.variable,
            aspectRatio:
                1,
            widthRatioConstant:
                1,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                0.25,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.NoteNumber]:
        {
            containerType: MsSymbolContainerTypeEnum.variable,
            aspectRatio:
                1,
            widthRatioConstant:
                1,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.NoteDot]:
        {
            aspectRatio: { // heightMultiplier除以1，保证宽度不变
                [0]:
                    1 / 0.7,
                [1]:
                    1 / 0.5,
                [2]:
                    1 / 0.3,
                [3]:
                    1 / 0.1,
                [5]:
                    1 / 0.1,
                [6]:
                    1 / 0.3,
                [7]:
                    1 / 0.5,
                [8]:
                    1 / 0.7,

            },
            category: MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0,
            heightMultiplier: {
                [0]:
                    0.7,
                [1]:
                    0.5,
                [2]:
                    0.3,
                [3]:
                    0.1,
                [5]:
                    0.1,
                [6]:
                    0.3,
                [7]:
                    0.5,
                [8]:
                    0.7,
            },
            space: {
                top: 0.1,
                bottom: 0.1,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.ChronaxieIncreasingLine]: {
        containerType: MsSymbolContainerTypeEnum.variable,
        aspectRatio:
            5,
        widthRatioConstant:
            1,
        category:
        MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier:
            0.1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.ChronaxieReducingLine]:
        {
            aspectRatio: { // 1 除以heightMultiplier，保持宽度不变
                [ChronaxieEnum.eighth]:
                    1 / 0.1,   // 7 flats
                [ChronaxieEnum.sixteenth]:
                    1 / 0.15,   // 7 flats
                [ChronaxieEnum.thirtySecond]:
                    1 / 0.2,   // 6 flats
                [ChronaxieEnum.sixtyFourth]:
                    1 / 0.25,   // 6 flats
            }
            ,
            category: MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0,
            heightMultiplier:
                {
                    [ChronaxieEnum.eighth]:
                        0.1,   // 7 flats
                    [ChronaxieEnum.sixteenth]:
                        0.15,   // 7 flats
                    [ChronaxieEnum.thirtySecond]:
                        0.2,   // 6 flats
                    [ChronaxieEnum.sixtyFourth]:
                        0.25,   // 6 flats
                },
            space: {
                top: 0,
                bottom: 0.1,
                left: 0,
                right: 0,
            }
        },
    [MsSymbolTypeEnum.NoteStem]:
        {  // 有些纯粹的符号跟随类型是没有符号容器类型的
            aspectRatio: 0.05,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0,
            heightMultiplier:
                0.75, // 符杠的height是动态的，这里只是最小高度
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.NoteTail]:
        {
            aspectRatio: {
                [ChronaxieEnum.eighth]:
                    4 / 10,   // 7 flats
                [ChronaxieEnum.sixteenth]:
                    4 / 10,   // 6 flats
                [ChronaxieEnum.thirtySecond]:
                    4 / 15,   // 7 flats
                [ChronaxieEnum.sixtyFourth]:
                    4 / 15,   // 6 flats
                [ChronaxieEnum.oneTwentyEighth]:
                    4 / 15,   // 7 flats
                [ChronaxieEnum.twoFiftySixth]:
                    4 / 20,   // 6 flats
            }
            ,
            category: MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0,
            heightMultiplier:
                0.5,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.Rest]:
        {// 休止符： 占位比例等于音符头
            containerType: MsSymbolContainerTypeEnum.variable,
            aspectRatio:
                0.25,
            widthRatioConstant:
                1,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.Slur]:
        {// 圆滑线：跨音符装饰线，不占宽度
            category: MsSymbolCategoryEnum.multipleMeasure,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.Tie]:
        {// 延音线：连接两个音符，不影响宽度
            category: MsSymbolCategoryEnum.multipleMeasure,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.DurationDot]:
        {// 附点：相对于音符有一点影响
            aspectRatio: 1,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0.5,
            heightMultiplier:
                0.1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.Accidental]:
        {
            aspectRatio: {
                [AccidentalEnum.None]: 0,
                [AccidentalEnum.Natural]: 1 / 3,
                [AccidentalEnum.Flat]: 1 / 3,
                [AccidentalEnum.Sharp]: 1 / 3,
                [AccidentalEnum.DoubleFlat]: 2 / 3,
                [AccidentalEnum.DoubleSharp]: 2 / 3,
            },
            category:
            MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0.5,
            heightMultiplier:
                0.4,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }

        }
    ,
    [MsSymbolTypeEnum.Tuplet]:
        { // 连音记号
            category: MsSymbolCategoryEnum.multipleMeasure,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.Clef]:
        { // 谱号
            containerType: MsSymbolContainerTypeEnum.rearFixed,
            aspectRatio: {
                [ClefEnum.Treble]:
                    0.6,
                [ClefEnum.Alto]:
                    0.5,
                [ClefEnum.Bass]:
                    1,
                [ClefEnum.BaritoneC]:
                    0.5,
                [ClefEnum.Tenor]:
                    0.5,
                [ClefEnum.BaritoneF]:
                    0.5,
                [ClefEnum.MezzoSoprano]:
                    0.5,
                [ClefEnum.Subbass]:
                    0.5,

            },
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                0.6,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.Clef_f]:
        { // 前置谱号
            containerType: MsSymbolContainerTypeEnum.frontFixed,
            aspectRatio: {
                [ClefEnum.Treble]:
                    0.6,
                [ClefEnum.Alto]:
                    0.5,
                [ClefEnum.Bass]:
                    1,
                [ClefEnum.BaritoneC]:
                    0.5,
                [ClefEnum.Tenor]:
                    0.5,
                [ClefEnum.BaritoneF]:
                    0.5,
                [ClefEnum.MezzoSoprano]:
                    0.5,
                [ClefEnum.Subbass]:
                    0.5,

            },
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.TimeSignature]:
        {
            containerType: MsSymbolContainerTypeEnum.frontFixed,
            aspectRatio:
                0.6,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.KeySignature]:
        {
            containerType: MsSymbolContainerTypeEnum.frontFixed,
            aspectRatio:
                {
                    [KeySignatureEnum.Cb]:
                        0.4 * 7,   // 7 flats
                    [KeySignatureEnum.Gb]:
                        0.4 * 6,   // 6 flats
                    [KeySignatureEnum.Db]:
                        0.4 * 5,   // 5 flats
                    [KeySignatureEnum.Ab]:
                        0.4 * 4,   // 4 flats
                    [KeySignatureEnum.Eb]:
                        0.4 * 3,   // 3 flats
                    [KeySignatureEnum.Bb]:
                        0.4 * 2,   // 2 flats
                    [KeySignatureEnum.F]:
                        0.4,    // 1 flat
                    [KeySignatureEnum.C]:
                        0.0,    // 0
                    [KeySignatureEnum.G]:
                        0.4,    // 1 sharp
                    [KeySignatureEnum.D]:
                        0.4 * 2,    // 2 sharps
                    [KeySignatureEnum.A]:
                        0.4 * 3,    // 3 sharps
                    [KeySignatureEnum.E]:
                        0.4 * 4,    // 4 sharps
                    [KeySignatureEnum.B]:
                        0.4 * 5,    // 5 sharps
                    [KeySignatureEnum['F#']]:
                        0.4 * 6,// 6 sharps
                    [KeySignatureEnum['C#']]:
                        0.4 * 7 // 7 sharps
                }
            ,
            category: MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.BarLine]:
        {
            containerType: MsSymbolContainerTypeEnum.rearFixed,
            aspectRatio:
                {
                    [BarLineTypeEnum.single]:
                        1 / 50,   // 7 flats
                    [BarLineTypeEnum.final]:
                        2 / 5,   // 7 flats
                    [BarLineTypeEnum.reverseFinal]:
                        2 / 5,   // 7 flats
                    [BarLineTypeEnum.startRepeatSign]:
                        3 / 5,   // 7 flats
                    [BarLineTypeEnum.endRepeatSign]:
                        3 / 5,   // 7 flats
                }
            ,
            category: MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
    [MsSymbolTypeEnum.BarLine_f]:
        {
            containerType: MsSymbolContainerTypeEnum.frontFixed,
            aspectRatio:
                {
                    [BarLineTypeEnum.single]:
                        1 / 400,   // 7 flats
                    [BarLineTypeEnum.final]:
                        2 / 5,   // 7 flats
                    [BarLineTypeEnum.reverseFinal]:
                        2 / 5,   // 7 flats
                    [BarLineTypeEnum.startRepeatSign]:
                        3 / 5,   // 7 flats
                    [BarLineTypeEnum.endRepeatSign]:
                        3 / 5,   // 7 flats
                }
            ,
            category: MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
            space: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }
    ,
}