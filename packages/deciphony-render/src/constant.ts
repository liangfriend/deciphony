// 宽度占比常数。与MsSymbolTypeEnum组合使用
import {
    BarLineTypeEnum, ChronaxieEnum,
    KeySignatureEnum, MsSymbolCategoryEnum, MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum, MusicScoreShowModeEnum
} from "../../deciphony-core/src/musicScoreEnum";


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


type FixedWidthSymbolInfo = { // 定宽符号没有宽度占比系数
    containerType: MsSymbolContainerTypeEnum.rearFixed | MsSymbolContainerTypeEnum.frontFixed
    aspectRatio: number | Record<string, number>// 特殊的定宽容器，宽高比有多个，取决于具体情况
    category: MsSymbolCategoryEnum.singleMeasure
    heightMultiplier: number    // 相对小节的高度倍数，用于计算高度
}


type VariableWidthSymbolInfo = {
    containerType: MsSymbolContainerTypeEnum.variable
    aspectRatio: number | Record<string, number>
    widthRatioConstant: number // 可为任意正数
    category: MsSymbolCategoryEnum.singleMeasure
    heightMultiplier: number
}
type pureFollowSymbolInfo = { // 纯粹的符号跟随类型  没有容器类型属性
    aspectRatio: number | Record<string, number>
    category: MsSymbolCategoryEnum
    widthRatioConstant: number
    heightMultiplier: number // 相对小节的高度倍数，用于计算高度
}

type MultipleMeasureSymbolInfo = {
    category: MsSymbolCategoryEnum.multipleMeasure
}

type MsSymbolInformation =
    | FixedWidthSymbolInfo
    | VariableWidthSymbolInfo
    | MultipleMeasureSymbolInfo
    | pureFollowSymbolInfo
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
                0.25,
        }
    ,
    [MsSymbolTypeEnum.NoteStem]:
        {  // 有些纯粹的符号跟随类型是没有符号容器类型的
            aspectRatio: 0.05,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0,
            heightMultiplier:
                0.75, // 符杠的height是动态的，这里只是最小高度
        }
    ,
    [MsSymbolTypeEnum.NoteTail]:
        {
            aspectRatio: {
                [ChronaxieEnum.eighth]:
                    0.5,   // 7 flats
                [ChronaxieEnum.sixteenth]:
                    0.5,   // 6 flats
            }
            ,
            category: MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0,
            heightMultiplier:
                0.5,
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
        }
    ,
    [MsSymbolTypeEnum.Slur]:
        {// 圆滑线：跨音符装饰线，不占宽度
            category: MsSymbolCategoryEnum.multipleMeasure,
        }
    ,
    [MsSymbolTypeEnum.Tie]:
        {// 延音线：连接两个音符，不影响宽度
            category: MsSymbolCategoryEnum.multipleMeasure,
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
        }
    ,
    [MsSymbolTypeEnum.Accidental]:
        {
            aspectRatio: 1,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            widthRatioConstant:
                0.5,
            heightMultiplier:
                0.4,

        }
    ,
    [MsSymbolTypeEnum.Tuplet]:
        { // 连音记号
            category: MsSymbolCategoryEnum.multipleMeasure,
        }
    ,
    [MsSymbolTypeEnum.Clef]:
        { // 谱号
            containerType: MsSymbolContainerTypeEnum.rearFixed,
            aspectRatio:
                0.6,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
        }
    ,
    [MsSymbolTypeEnum.Clef_f]:
        { // 前置谱号
            containerType: MsSymbolContainerTypeEnum.frontFixed,
            aspectRatio:
                0.6,
            category:
            MsSymbolCategoryEnum.singleMeasure,
            heightMultiplier:
                1,
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
        }
    ,
}