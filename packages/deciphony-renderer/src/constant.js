// 宽度占比常数。与MsSymbolTypeEnum组合使用
import { BarLineTypeEnum, ChronaxieEnum, KeySignatureEnum, MsSymbolCategoryEnum, MsSymbolContainerTypeEnum, MsSymbolTypeEnum } from "deciphony-core";
export const KeySignatureTonicSemitones = {
    [KeySignatureEnum.Cb]: 11, // B
    [KeySignatureEnum.Gb]: 6, // Gb
    [KeySignatureEnum.Db]: 1, // Db
    [KeySignatureEnum.Ab]: 8, // Ab
    [KeySignatureEnum.Eb]: 3, // Eb
    [KeySignatureEnum.Bb]: 10, // Bb
    [KeySignatureEnum.F]: 5, // F
    [KeySignatureEnum.C]: 0, // C
    [KeySignatureEnum.G]: 7, // G
    [KeySignatureEnum.D]: 2, // D
    [KeySignatureEnum.A]: 9, // A
    [KeySignatureEnum.E]: 4, // E
    [KeySignatureEnum.B]: 11, // B
    [KeySignatureEnum['F#']]: 6, // F#
    [KeySignatureEnum['C#']]: 1 // C#
};
export const MsSymbolInformationMap = {
    [MsSymbolTypeEnum.NoteHead]: {
        containerType: MsSymbolContainerTypeEnum.variable,
        aspectRatio: 1,
        widthRatioConstant: 1,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 0.25,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.NoteNumber]: {
        containerType: MsSymbolContainerTypeEnum.variable,
        aspectRatio: 1,
        widthRatioConstant: 1,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.NoteDot]: {
        aspectRatio: {
            [0]: 1 / 0.7,
            [1]: 1 / 0.5,
            [2]: 1 / 0.3,
            [3]: 1 / 0.1,
            [5]: 1 / 0.1,
            [6]: 1 / 0.3,
            [7]: 1 / 0.5,
            [8]: 1 / 0.7,
        },
        category: MsSymbolCategoryEnum.singleMeasure,
        widthRatioConstant: 0,
        heightMultiplier: {
            [0]: 0.7,
            [1]: 0.5,
            [2]: 0.3,
            [3]: 0.1,
            [5]: 0.1,
            [6]: 0.3,
            [7]: 0.5,
            [8]: 0.7,
        },
        space: {
            top: 0.1,
            bottom: 0.1,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.ChronaxieIncreasingLine]: {
        containerType: MsSymbolContainerTypeEnum.variable,
        aspectRatio: 5,
        widthRatioConstant: 1,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 0.1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.ChronaxieReducingLine]: {
        aspectRatio: {
            [ChronaxieEnum.eighth]: 1 / 0.1, // 7 flats
            [ChronaxieEnum.sixteenth]: 1 / 0.15, // 7 flats
            [ChronaxieEnum.thirtySecond]: 1 / 0.2, // 6 flats
            [ChronaxieEnum.sixtyFourth]: 1 / 0.25, // 6 flats
        },
        category: MsSymbolCategoryEnum.singleMeasure,
        widthRatioConstant: 0,
        heightMultiplier: {
            [ChronaxieEnum.eighth]: 0.1, // 7 flats
            [ChronaxieEnum.sixteenth]: 0.15, // 7 flats
            [ChronaxieEnum.thirtySecond]: 0.2, // 6 flats
            [ChronaxieEnum.sixtyFourth]: 0.25, // 6 flats
        },
        space: {
            top: 0,
            bottom: 0.1,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.NoteStem]: {
        aspectRatio: 0.05,
        category: MsSymbolCategoryEnum.singleMeasure,
        widthRatioConstant: 0,
        heightMultiplier: 0.75, // 符杠的height是动态的，这里只是最小高度
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.NoteTail]: {
        aspectRatio: {
            [ChronaxieEnum.eighth]: 0.5, // 7 flats
            [ChronaxieEnum.sixteenth]: 0.5, // 6 flats
        },
        category: MsSymbolCategoryEnum.singleMeasure,
        widthRatioConstant: 0,
        heightMultiplier: 0.5,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Rest]: {
        containerType: MsSymbolContainerTypeEnum.variable,
        aspectRatio: 0.25,
        widthRatioConstant: 1,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Slur]: {
        category: MsSymbolCategoryEnum.multipleMeasure,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Tie]: {
        category: MsSymbolCategoryEnum.multipleMeasure,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.DurationDot]: {
        aspectRatio: 1,
        category: MsSymbolCategoryEnum.singleMeasure,
        widthRatioConstant: 0.5,
        heightMultiplier: 0.1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Accidental]: {
        aspectRatio: 1,
        category: MsSymbolCategoryEnum.singleMeasure,
        widthRatioConstant: 0.5,
        heightMultiplier: 0.4,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Tuplet]: {
        category: MsSymbolCategoryEnum.multipleMeasure,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Clef]: {
        containerType: MsSymbolContainerTypeEnum.rearFixed,
        aspectRatio: 0.6,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.Clef_f]: {
        containerType: MsSymbolContainerTypeEnum.frontFixed,
        aspectRatio: 0.6,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.TimeSignature]: {
        containerType: MsSymbolContainerTypeEnum.frontFixed,
        aspectRatio: 0.6,
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.KeySignature]: {
        containerType: MsSymbolContainerTypeEnum.frontFixed,
        aspectRatio: {
            [KeySignatureEnum.Cb]: 0.4 * 7, // 7 flats
            [KeySignatureEnum.Gb]: 0.4 * 6, // 6 flats
            [KeySignatureEnum.Db]: 0.4 * 5, // 5 flats
            [KeySignatureEnum.Ab]: 0.4 * 4, // 4 flats
            [KeySignatureEnum.Eb]: 0.4 * 3, // 3 flats
            [KeySignatureEnum.Bb]: 0.4 * 2, // 2 flats
            [KeySignatureEnum.F]: 0.4, // 1 flat
            [KeySignatureEnum.C]: 0.0, // 0
            [KeySignatureEnum.G]: 0.4, // 1 sharp
            [KeySignatureEnum.D]: 0.4 * 2, // 2 sharps
            [KeySignatureEnum.A]: 0.4 * 3, // 3 sharps
            [KeySignatureEnum.E]: 0.4 * 4, // 4 sharps
            [KeySignatureEnum.B]: 0.4 * 5, // 5 sharps
            [KeySignatureEnum['F#']]: 0.4 * 6, // 6 sharps
            [KeySignatureEnum['C#']]: 0.4 * 7 // 7 sharps
        },
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.BarLine]: {
        containerType: MsSymbolContainerTypeEnum.rearFixed,
        aspectRatio: {
            [BarLineTypeEnum.single]: 1 / 50, // 7 flats
            [BarLineTypeEnum.final]: 2 / 5, // 7 flats
            [BarLineTypeEnum.reverseFinal]: 2 / 5, // 7 flats
            [BarLineTypeEnum.startRepeatSign]: 3 / 5, // 7 flats
            [BarLineTypeEnum.endRepeatSign]: 3 / 5, // 7 flats
        },
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
    [MsSymbolTypeEnum.BarLine_f]: {
        containerType: MsSymbolContainerTypeEnum.frontFixed,
        aspectRatio: {
            [BarLineTypeEnum.single]: 1 / 400, // 7 flats
            [BarLineTypeEnum.final]: 2 / 5, // 7 flats
            [BarLineTypeEnum.reverseFinal]: 2 / 5, // 7 flats
            [BarLineTypeEnum.startRepeatSign]: 3 / 5, // 7 flats
            [BarLineTypeEnum.endRepeatSign]: 3 / 5, // 7 flats
        },
        category: MsSymbolCategoryEnum.singleMeasure,
        heightMultiplier: 1,
        space: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        }
    },
};
