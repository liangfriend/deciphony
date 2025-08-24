import {
    AccidentalEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolTypeEnum, MsTypeNameEnum,
    NoteNameEnum,
    MusicScoreRegionEnum
} from "../musicScoreEnum";

import {
    BeamGroup,
    BeamGroupItem,
    IndexData,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MsType,
    MultipleStaves,
    MusicScore,
    MusicScoreIndex,
    NoteHead,
    SingleStaff, SpanSymbol
} from "../types";

const semitoneMap: { [key: string]: number } = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
    E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8,
    A: 9, 'A#': 10, Bb: 10, B: 11,
};

const reverseMap: { [key: number]: string[] } = {
    0: ['C'], 1: ['C#', 'Db'], 2: ['D'], 3: ['D#', 'Eb'], 4: ['E'],
    5: ['F'], 6: ['F#', 'Gb'], 7: ['G'], 8: ['G#', 'Ab'], 9: ['A'],
    10: ['A#', 'Bb'], 11: ['B'],
};

function getSemitoneNumber(note: string, octave: number): number {
    const semitone = semitoneMap[note];
    return (octave + 1) * 12 + semitone;
}

function findValidEnumName(semitoneNumber: number): NoteNameEnum {
    const pitchClass = semitoneNumber % 12;
    const octave = Math.floor(semitoneNumber / 12) - 1;
    const possibleNames = reverseMap[pitchClass];

    for (const name of possibleNames) {
        const fullName = `${name}${octave}`;
        if (fullName in NoteNameEnum) {
            return NoteNameEnum[fullName as keyof typeof NoteNameEnum];
        }
    }

    return NoteNameEnum.C4; // fallback
}

// 核心算法：计算当前音符音名
export function getNoteMusicalAlphabet(
    msSymbol: NoteHead,
    musicScore: MusicScore
): NoteNameEnum {
    const region = msSymbol.region
    const clef: ClefEnum = getMsSymbolClef(msSymbol, musicScore)
    const keySignature: KeySignatureEnum = getMsSymbolKeySignature(msSymbol, musicScore)

    const accidental = getAccidental(msSymbol)
    const regionIndexMap: Record<MusicScoreRegionEnum, number> = {
        [MusicScoreRegionEnum.lower_line_18]: -35,
        [MusicScoreRegionEnum.lower_space_18]: -34,
        [MusicScoreRegionEnum.lower_line_17]: -33,
        [MusicScoreRegionEnum.lower_space_17]: -32,
        [MusicScoreRegionEnum.lower_line_16]: -31,
        [MusicScoreRegionEnum.lower_space_16]: -30,
        [MusicScoreRegionEnum.lower_line_15]: -29,
        [MusicScoreRegionEnum.lower_space_15]: -28,
        [MusicScoreRegionEnum.lower_line_14]: -27,
        [MusicScoreRegionEnum.lower_space_14]: -26,
        [MusicScoreRegionEnum.lower_line_13]: -25,
        [MusicScoreRegionEnum.lower_space_13]: -24,
        [MusicScoreRegionEnum.lower_line_12]: -23,
        [MusicScoreRegionEnum.lower_space_12]: -22,
        [MusicScoreRegionEnum.lower_line_11]: -21,
        [MusicScoreRegionEnum.lower_space_11]: -20,
        [MusicScoreRegionEnum.lower_line_10]: -19,
        [MusicScoreRegionEnum.lower_space_10]: -18,
        [MusicScoreRegionEnum.lower_line_9]: -17,
        [MusicScoreRegionEnum.lower_space_9]: -16,
        [MusicScoreRegionEnum.lower_line_8]: -15,
        [MusicScoreRegionEnum.lower_space_8]: -14,
        [MusicScoreRegionEnum.lower_line_7]: -13,
        [MusicScoreRegionEnum.lower_space_7]: -12,
        [MusicScoreRegionEnum.lower_line_6]: -11,
        [MusicScoreRegionEnum.lower_space_6]: -10,
        [MusicScoreRegionEnum.lower_line_5]: -9,
        [MusicScoreRegionEnum.lower_space_5]: -8,
        [MusicScoreRegionEnum.lower_line_4]: -7,
        [MusicScoreRegionEnum.lower_space_4]: -6,
        [MusicScoreRegionEnum.lower_line_3]: -5,
        [MusicScoreRegionEnum.lower_space_3]: -4,
        [MusicScoreRegionEnum.lower_line_2]: -3,
        [MusicScoreRegionEnum.lower_space_2]: -2,
        [MusicScoreRegionEnum.lower_line_1]: -1,
        [MusicScoreRegionEnum.lower_space_1]: 0,
        [MusicScoreRegionEnum.line_1]: 1,
        [MusicScoreRegionEnum.space_1]: 2,
        [MusicScoreRegionEnum.line_2]: 3,
        [MusicScoreRegionEnum.space_2]: 4,
        [MusicScoreRegionEnum.line_3]: 5,
        [MusicScoreRegionEnum.space_3]: 6,
        [MusicScoreRegionEnum.line_4]: 7,
        [MusicScoreRegionEnum.space_4]: 8,
        [MusicScoreRegionEnum.line_5]: 9,
        [MusicScoreRegionEnum.upper_space_1]: 10,
        [MusicScoreRegionEnum.upper_line_1]: 11,
        [MusicScoreRegionEnum.upper_space_2]: 12,
        [MusicScoreRegionEnum.upper_line_2]: 13,
        [MusicScoreRegionEnum.upper_space_3]: 14,
        [MusicScoreRegionEnum.upper_line_3]: 15,
        [MusicScoreRegionEnum.upper_space_4]: 16,
        [MusicScoreRegionEnum.upper_line_4]: 17,
        [MusicScoreRegionEnum.upper_space_5]: 18,
        [MusicScoreRegionEnum.upper_line_5]: 19,
        [MusicScoreRegionEnum.upper_space_6]: 20,
        [MusicScoreRegionEnum.upper_line_6]: 21,
        [MusicScoreRegionEnum.upper_space_7]: 22,
        [MusicScoreRegionEnum.upper_line_7]: 23,
        [MusicScoreRegionEnum.upper_space_8]: 24,
        [MusicScoreRegionEnum.upper_line_8]: 25,
        [MusicScoreRegionEnum.upper_space_9]: 10,
        [MusicScoreRegionEnum.upper_line_9]: 11,
        [MusicScoreRegionEnum.upper_space_10]: 12,
        [MusicScoreRegionEnum.upper_line_10]: 13,
        [MusicScoreRegionEnum.upper_space_11]: 14,
        [MusicScoreRegionEnum.upper_line_11]: 15,
        [MusicScoreRegionEnum.upper_space_12]: 16,
        [MusicScoreRegionEnum.upper_line_12]: 17,
        [MusicScoreRegionEnum.upper_space_13]: 18,
        [MusicScoreRegionEnum.upper_line_13]: 19,
        [MusicScoreRegionEnum.upper_space_14]: 20,
        [MusicScoreRegionEnum.upper_line_14]: 21,
        [MusicScoreRegionEnum.upper_space_15]: 22,
        [MusicScoreRegionEnum.upper_line_15]: 23,
        [MusicScoreRegionEnum.upper_space_16]: 24,
        [MusicScoreRegionEnum.upper_line_16]: 25,


    };

    const naturalPitchOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    // 定义每种 clef 的参考点（该谱号的某个区域，对应的音名与八度）
    const clefBaseMap: Record<ClefEnum, { region: MusicScoreRegionEnum, note: string, octave: number }> = {
        [ClefEnum.treble]: {region: MusicScoreRegionEnum.line_2, note: 'G', octave: 4}, // G4 on line 2
        [ClefEnum.mezzoSoprano]: {region: MusicScoreRegionEnum.line_2, note: 'C', octave: 4}, // C4 on line 2
        [ClefEnum.alto]: {region: MusicScoreRegionEnum.line_3, note: 'C', octave: 4}, // C4 on line 3
        [ClefEnum.tenor]: {region: MusicScoreRegionEnum.line_4, note: 'C', octave: 4}, // C4 on line 4
        [ClefEnum.baritoneC]: {region: MusicScoreRegionEnum.line_5, note: 'C', octave: 4}, // C4 on line 5
        [ClefEnum.baritoneF]: {region: MusicScoreRegionEnum.line_3, note: 'F', octave: 3}, // F3 on line 3
        [ClefEnum.bass]: {region: MusicScoreRegionEnum.line_4, note: 'F', octave: 3}, // F3 on line 4
        [ClefEnum.subbass]: {region: MusicScoreRegionEnum.line_5, note: 'F', octave: 3}, // F3 on line 5
    };

    const base = clefBaseMap[clef ? clef : ClefEnum.treble];
    const baseRegionIndex = regionIndexMap[base.region];
    const targetRegionIndex = regionIndexMap[region];
    const relativeSteps = targetRegionIndex - baseRegionIndex;

    // 从基础音名出发，按7度自然音程移动，获得目标音名和八度
    let stepIndex = naturalPitchOrder.indexOf(base.note);
    let octave = base.octave;

    stepIndex = (stepIndex + relativeSteps) % 7;
    if (stepIndex < 0) stepIndex += 7;

    const name = naturalPitchOrder[stepIndex];
    const octaveShift = Math.floor((naturalPitchOrder.indexOf(base.note) + relativeSteps) / 7);
    octave += octaveShift;

    // 计算调号或变音对音高的影响（±semitone）
    let semitoneOffset = 0;

    if (accidental !== undefined) {
        switch (accidental) {
            case AccidentalEnum.flat:
            case AccidentalEnum.natureFlat:
                semitoneOffset = -1;
                break;
            case AccidentalEnum.sharp:
            case AccidentalEnum.natureSharp:
                semitoneOffset = 1;
                break;
            case AccidentalEnum.doubleFlat:
                semitoneOffset = -2;
                break;
            case AccidentalEnum.doubleSharp:
                semitoneOffset = 2;
                break;
            case AccidentalEnum.nature:
            default:
                semitoneOffset = 0;
                break;
        }
    } else {
        const keySignatureMap: Record<KeySignatureEnum, string[]> = {
            Cb: ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
            Gb: ['B', 'E', 'A', 'D', 'G', 'C'],
            Db: ['B', 'E', 'A', 'D', 'G'],
            Ab: ['B', 'E', 'A', 'D'],
            Eb: ['B', 'E', 'A'],
            Bb: ['B', 'E'],
            F: ['B'],
            C: [],
            G: ['F'],
            D: ['F', 'C'],
            A: ['F', 'C', 'G'],
            E: ['F', 'C', 'G', 'D'],
            B: ['F', 'C', 'G', 'D', 'A'],
            'F#': ['F', 'C', 'G', 'D', 'A', 'E'],
            'C#': ['F', 'C', 'G', 'D', 'A', 'E', 'B'],
        };
        const altered = keySignatureMap[keySignature];
        if (altered.includes(name)) {
            semitoneOffset = keySignature >= KeySignatureEnum.C ? 1 : -1;
        }
    }

    const baseSemitone = getSemitoneNumber(name, octave);
    const finalSemitone = baseSemitone + semitoneOffset;

    return findValidEnumName(finalSemitone);
}

// 获取音符的变音符号
export function getAccidental(noteHead: NoteHead): AccidentalEnum | undefined {
    let accidental: AccidentalEnum | null = null
    if (!noteHead.msSymbolArray) {
        return
    }
    for (let item of noteHead.msSymbolArray) {
        if (item.type === MsSymbolTypeEnum.accidental) {
            accidental = item.accidental
            return accidental
        }
    }

    return
}

export type TraverseLevel = 'multipleStaves' | 'singleStaff' | 'measure' | 'container' | 'symbol'
export type TraverseOrder = 'asc' | 'desc'

export interface TraverseContext {
    multipleStavesIndex: number
    singleStaffIndex: number
    measureIndex: number
    msSymbolContainerIndex?: number
    msSymbolIndex?: number
    multipleStaves?: MultipleStaves
    singleStaff?: SingleStaff
    measure?: Measure
    msSymbolContainer?: MsSymbolContainer
    msSymbol?: MsSymbol
}

export type TraverseCallback = (context: TraverseContext) => boolean | void

// 循环方法 return停止循环
export function traverseMusicScore(
    musicScore: MusicScore,
    {
        level = 'symbol',
        order = 'asc',
        callback
    }: {
        level: TraverseLevel
        order?: TraverseOrder
        callback: TraverseCallback
    }
): void {
    const range = (length: number) => order === 'asc'
        ? [...Array(length).keys()]
        : [...Array(length).keys()].reverse()

    const multipleStavesArray = musicScore.multipleStavesArray
    for (const i of range(multipleStavesArray.length)) {
        const multipleStaves = multipleStavesArray[i]
        if (level === 'multipleStaves') {
            const stop = callback({
                multipleStavesIndex: i,
                singleStaffIndex: -1,
                measureIndex: -1,
                multipleStaves,
            })
            if (stop) return
            continue
        }

        for (const j of range(multipleStaves.singleStaffArray.length)) {
            const singleStaff = multipleStaves.singleStaffArray[j]
            if (level === 'singleStaff') {
                const stop = callback({
                    multipleStavesIndex: i,
                    singleStaffIndex: j,
                    measureIndex: -1,
                    multipleStaves,
                    singleStaff,
                })
                if (stop) return
                continue
            }

            for (const k of range(singleStaff.measureArray.length)) {
                const measure = singleStaff.measureArray[k]
                if (level === 'measure') {
                    const stop = callback({
                        multipleStavesIndex: i,
                        singleStaffIndex: j,
                        measureIndex: k,
                        multipleStaves,
                        singleStaff,
                        measure,
                    })
                    if (stop) return
                    continue
                }

                for (const l of range(measure.msSymbolContainerArray.length)) {
                    const container = measure.msSymbolContainerArray[l]
                    if (level === 'container') {
                        const stop = callback({
                            multipleStavesIndex: i,
                            singleStaffIndex: j,
                            measureIndex: k,
                            msSymbolContainerIndex: l,
                            multipleStaves,
                            singleStaff,
                            measure,
                            msSymbolContainer: container
                        })
                        if (stop) return
                        continue
                    }

                    for (const t of range(container.msSymbolArray.length)) {
                        const symbol = container.msSymbolArray[t]
                        const stop = callback({
                            multipleStavesIndex: i,
                            singleStaffIndex: j,
                            measureIndex: k,
                            msSymbolContainerIndex: l,
                            msSymbolIndex: t,
                            multipleStaves,
                            singleStaff,
                            measure,
                            msSymbolContainer: container,
                            msSymbol: symbol,
                        })
                        if (stop) return
                    }
                }
            }
        }
    }
}

// 传入两个小节的index, 循环其中的小节
export function traverseMeasure(startIndex: MusicScoreIndex, endIndex: MusicScoreIndex, musicScore: MusicScore, callBack: (measure: Measure, singleStaff: SingleStaff, multipleStaves: MultipleStaves) => void) {
    if (endIndex.multipleStavesIndex == null || startIndex.multipleStavesIndex == null || startIndex.measureIndex == null || endIndex.measureIndex == null || startIndex.singleStaffIndex == null) {
        return console.error("索引元素有误，无法正确执行traverseMeasure")
    }
    const singleStaffIndex = startIndex.singleStaffIndex
    const startData = getDataWithIndex(startIndex, musicScore)
    const endData = getDataWithIndex(endIndex, musicScore)
    // const startMeasure = startData.measure
    // const endMeasure = endData.measure
    const startSingleStaff = startData.singleStaff
    const endSingleStaff = endData.singleStaff
    const startMultipleStaves = startData.multipleStaves
    const endMultipleStaves = endData.multipleStaves
    if (startMultipleStaves === endMultipleStaves) {  // 在同一行


        if (startSingleStaff == null || startMultipleStaves == null) {
            return console.error("索引元素有误，无法正确执行traverseMeasure")
        }
        for (let j = startIndex.measureIndex; j <= endIndex.measureIndex; j++) {
            const curMeasure = startSingleStaff.measureArray[j]
            callBack(curMeasure, startSingleStaff, startMultipleStaves)
        }


    } else { // 在不同行
        for (let i = startIndex.multipleStavesIndex; i <= endIndex.multipleStavesIndex; i++) {
            const curMultipleStaves = musicScore.multipleStavesArray[i]
            const curSingleStaff = curMultipleStaves.singleStaffArray[singleStaffIndex]

            if (startMultipleStaves === curMultipleStaves) {  // 开头行的情况
                for (let j = startIndex.measureIndex; j < curSingleStaff.measureArray.length; j++) {
                    const curMeasure = curSingleStaff.measureArray[j]
                    callBack(curMeasure, curSingleStaff, curMultipleStaves)
                }
            } else if (startMultipleStaves !== curMultipleStaves && endMultipleStaves !== curMultipleStaves) {  // 中间行的情况
                for (let j = 0; j < curSingleStaff.measureArray.length; j++) {
                    const curMeasure = curSingleStaff.measureArray[j]
                    callBack(curMeasure, curSingleStaff, curMultipleStaves)
                }
            } else if (endMultipleStaves === curMultipleStaves && startMultipleStaves !== endMultipleStaves) { // 结束行的情况
                for (let j = 0; j < endIndex.measureIndex; j++) {
                    const curMeasure = curSingleStaff.measureArray[j]
                    callBack(curMeasure, curSingleStaff, curMultipleStaves)
                }
            }


        }
    }

}

// index赋值
export function setMultipleStavesIndex(musicScore: MusicScore) {
    musicScore.multipleStavesArray.forEach((multipleStaves, i) => {
        multipleStaves.index = {
            multipleStavesIndex: i,
            singleStaffIndex: -1,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        };
        setSingleStaffArrayIndex(multipleStaves);
    });
}

export function setSingleStaffArrayIndex(multipleStaves: MultipleStaves) {
    const multipleStavesIndex = multipleStaves.index.multipleStavesIndex
    if (multipleStavesIndex == null) {
        return console.error("数据有误，复谱表索引生成失败")
    }
    multipleStaves.singleStaffArray.forEach((singleStaff, j) => {
        singleStaff.index = {
            multipleStavesIndex,
            singleStaffIndex: j,
            measureIndex: -1,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        };
        setMeasureArrayIndex(singleStaff);
    });
}

export function setMeasureArrayIndex(singleStaff: SingleStaff) {
    const singleStaffIndex = singleStaff.index.singleStaffIndex
    const multipleStavesIndex = singleStaff.index.multipleStavesIndex

    if (multipleStavesIndex == null || singleStaffIndex == null) {
        return console.error("数据有误，单谱表索引生成失败")
    }
    singleStaff.measureArray.forEach((measure, k) => {
        measure.index = {
            multipleStavesIndex,
            singleStaffIndex,
            measureIndex: k,
            msSymbolContainerIndex: -1,
            msSymbolIndex: -1
        };
        setMsSymbolContainerArrayIndex(measure);
    });
}

export function setMsSymbolContainerArrayIndex(measure: Measure) {
    const singleStaffIndex = measure.index.singleStaffIndex
    const multipleStavesIndex = measure.index.multipleStavesIndex
    const measureIndex = measure.index.measureIndex
    if (multipleStavesIndex == null || singleStaffIndex == null || measureIndex == null) {
        return console.error("数据有误，符号容器索引生成失败")
    }
    measure.msSymbolContainerArray.forEach((container, l) => {

        container.index = {
            multipleStavesIndex,
            singleStaffIndex,
            measureIndex,
            msSymbolContainerIndex: l,
            msSymbolIndex: -1
        };
        setMsSymbolArrayIndex(container);
    });
}

export function setMsSymbolArrayIndex(container: MsSymbolContainer) {

    const singleStaffIndex = container.index.singleStaffIndex
    const multipleStavesIndex = container.index.multipleStavesIndex
    const measureIndex = container.index.measureIndex
    const msSymbolContainerIndex = container.index.msSymbolContainerIndex
    if (multipleStavesIndex == null || singleStaffIndex == null || measureIndex == null || msSymbolContainerIndex == null) {
        return console.error("数据有误，符号索引生成失败")
    }

    container.msSymbolArray.forEach((curMsSymbol, t) => {
        const index = {
            multipleStavesIndex,
            singleStaffIndex,
            measureIndex,
            msSymbolContainerIndex,
            msSymbolIndex: t
        };
        curMsSymbol.index = index
        setChildMsSymbolArrayIndex(curMsSymbol)
    });
}

// 传入第二个参数，可以让第一个参数传入跟随符号
export function setChildMsSymbolArrayIndex(msSymbol: MsSymbol, musicScore?: MusicScore) {

    let targetMsSymbol: MsSymbol = null! as MsSymbol
    // 未防止传入跟随符号，需要经过下面一行转换, 如果不传可以加快速度，但是有报错风险
    if (musicScore) {
        targetMsSymbol = getDataWithIndex(msSymbol.index, musicScore)?.msSymbol as MsSymbol
    } else {
        targetMsSymbol = msSymbol
    }
    targetMsSymbol.msSymbolArray.forEach((curMsSymbol, t) => {
        curMsSymbol.index = targetMsSymbol.index
        if (curMsSymbol.msSymbolArray.length > 0) {
            setChildMsSymbolArrayIndex(curMsSymbol, musicScore)
        }
    })
}

// 获取某一符号所应用的谱号
export function getMsSymbolClef(msSymbol: MsSymbol, musicScore: MusicScore): ClefEnum {
    const msData = getDataWithIndex(msSymbol.index, musicScore)
    const msSymbolContainer = msData.msSymbolContainer
    const measure = msData.measure
    const singleStaff = msData.singleStaff

    const measureIndex = measure?.index.measureIndex
    const msSymbolContainerIndex = msSymbolContainer?.index.msSymbolContainerIndex

    if (!msSymbolContainer || !measure || !singleStaff || (msSymbolContainerIndex == null) || (measureIndex == null)) {
        console.error("索引数据查找出错，获取符号的谱号失败")
        return ClefEnum.treble
    }
    for (let i = (measureIndex); i >= 0; i--) {
        const curMeasure = singleStaff.measureArray[i];
        if (i === measureIndex) {
            for (let j = msSymbolContainerIndex; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.clef === curMsSymbol.type || MsSymbolTypeEnum.clef_f === curMsSymbol.type) {
                    return curMsSymbol.clef
                }
            }
        } else {
            for (let j = curMeasure.msSymbolContainerArray.length - 1; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.clef === curMsSymbol.type || MsSymbolTypeEnum.clef_f === curMsSymbol.type) {
                    return curMsSymbol.clef
                }
            }
        }


    }
    return ClefEnum.treble
}

// 获取某一符号所应用的谱号
export function getMsSymbolKeySignature(msSymbol: MsSymbol, musicScore: MusicScore): KeySignatureEnum {
    const msData = getDataWithIndex(msSymbol.index, musicScore)
    const msSymbolContainer = msData.msSymbolContainer
    const measure = msData.measure
    const singleStaff = msData.singleStaff

    const measureIndex = measure?.index.measureIndex
    const msSymbolContainerIndex = msSymbolContainer?.index.msSymbolContainerIndex

    if (!msSymbolContainer || !measure || !singleStaff || (msSymbolContainerIndex == null) || (measureIndex == null)) {
        console.error("索引数据查找出错，获取符号的谱号失败")
        return KeySignatureEnum.C
    }
    for (let i = (measureIndex); i >= 0; i--) {
        const curMeasure = singleStaff.measureArray[i];
        if (i === measureIndex) {
            for (let j = msSymbolContainerIndex; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.keySignature === curMsSymbol.type) {
                    return curMsSymbol.keySignature
                }
            }
        } else {
            for (let j = curMeasure.msSymbolContainerArray.length - 1; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.keySignature === curMsSymbol.type) {
                    return curMsSymbol.keySignature
                }
            }
        }


    }
    return KeySignatureEnum.C
}


// 生成hsahMap()
export function mapGenerate(musicScore: MusicScore): void {
    const msDataMap = musicScore.map;

    for (let i = 0; i < musicScore.multipleStavesArray.length; i++) {
        const muptipleStaves = musicScore.multipleStavesArray[i];
        msDataMap[muptipleStaves.id] = muptipleStaves;

        for (let j = 0; j < muptipleStaves.singleStaffArray.length; j++) {
            const singleStaff = muptipleStaves.singleStaffArray[j];
            msDataMap[singleStaff.id] = singleStaff;

            for (let k = 0; k < singleStaff.measureArray.length; k++) {
                const measure = singleStaff.measureArray[k];
                msDataMap[measure.id] = measure;

                for (let l = 0; l < measure.msSymbolContainerArray.length; l++) {
                    const msSymbolContainer = measure.msSymbolContainerArray[l];
                    msDataMap[msSymbolContainer.id] = msSymbolContainer;

                    for (let t = 0; t < msSymbolContainer.msSymbolArray.length; t++) {
                        const msSymbol = msSymbolContainer.msSymbolArray[t];
                        msDataMap[msSymbol.id] = msSymbol;
                    }
                }
            }
        }
    }

}

// 判断direction
export function judgeDirection(region: MusicScoreRegionEnum): 'up' | 'down' {
    if (region <= MusicScoreRegionEnum.space_2) {
        return 'up'
    } else {
        return 'down'
    }
}

// 查询内容
export function getTarget(id: number, msDataMap: Record<number, MsType>): MsType | undefined {

    const target = msDataMap[id]
    if (target) {
        return target
    } else {
        console.warn('此id元素不存在')
    }
    return
}

// 通过索引获取内容
export function getDataWithIndex(index: MusicScoreIndex, musicScore: MusicScore): IndexData {
    const res: IndexData = {
        multipleStaves: null,
        singleStaff: null,
        measure: null,
        msSymbolContainer: null,
        msSymbol: null,
    }

    if (index.multipleStavesIndex !== -1) {
        const multipleStaves = musicScore.multipleStavesArray[index.multipleStavesIndex]
        res.multipleStaves = multipleStaves
        if (index.singleStaffIndex !== -1) {
            const singleStaff = multipleStaves.singleStaffArray[index.singleStaffIndex]
            res.singleStaff = singleStaff
            if (index.measureIndex !== -1) {
                const measure = singleStaff.measureArray[index.measureIndex]
                res.measure = measure
                if (index.msSymbolContainerIndex !== -1) {
                    const msSymbolContainer = measure.msSymbolContainerArray[index.msSymbolContainerIndex]
                    res.msSymbolContainer = msSymbolContainer
                    if (index.msSymbolIndex !== -1) {
                        res.msSymbol = msSymbolContainer.msSymbolArray[index.msSymbolIndex]
                    }

                }

            }

        }
    }
    return res
}

// 获取小节绑定spanSymbolId
export function getMeasureRelatedSpanSymbolList(measure: Measure, musicScore: MusicScore): Set<number> {
    const spanSymbolIdList = new Set<number>();
    measure.bindingEndId.forEach((spanSymbolId) => {
        spanSymbolIdList.add(spanSymbolId);
    })
    measure.bindingStartId.forEach((spanSymbolId) => {
        spanSymbolIdList.add(spanSymbolId);
    })
    measure.msSymbolContainerArray.forEach((msSymbolContainer, index) => {
        msSymbolContainer.msSymbolArray.forEach((msSymbol, index) => {
            msSymbol.bindingEndId.forEach((spanSymbolId) => {
                spanSymbolIdList.add(spanSymbolId);
            })
            msSymbol.bindingStartId.forEach((spanSymbolId) => {
                spanSymbolIdList.add(spanSymbolId);
            })
        })
    })
    return spanSymbolIdList
}

// 获取单谱表绑定spanSymbolId
export function getSingleStaffRelatedSpanSymbolList(singleStaff: SingleStaff, musicScore: MusicScore): Set<number> {
    let spanSymbolIdList = new Set<number>();
    singleStaff.measureArray.forEach((measure) => {
        const measureSpanIds = getMeasureRelatedSpanSymbolList(measure, musicScore);
        spanSymbolIdList = new Set([...spanSymbolIdList, ...measureSpanIds]);
    })
    return spanSymbolIdList
}

// 获取复谱表绑定spanSymbolId
export function getMultipleStavesRelatedSpanSymbolList(multipleStaves: MultipleStaves, musicScore: MusicScore): Set<number> {
    let spanSymbolIdList = new Set<number>();
    multipleStaves.singleStaffArray.forEach((singleStaff) => {
        const measureSpanIds = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore);
        spanSymbolIdList = new Set([...spanSymbolIdList, ...measureSpanIds]);
    })
    return spanSymbolIdList
}

// 获取谱表所有spanSymbolId
export function getMusicScoreRelatedSpanSymbolList(musicScore: MusicScore): Set<number> {
    let spanSymbolIdList = new Set<number>();
    musicScore.spanSymbolArray.forEach((spanSymbol) => {
        spanSymbolIdList.add(spanSymbol.id)
    })

    return spanSymbolIdList
}

// 更新spanSymbol视图
export function updateSpanSymbolView(spanSymbolIdList: Set<number>, musicScore: MusicScore) {
    musicScore.spanSymbolArray.forEach((spanSymbol) => {
        if (spanSymbolIdList.has(spanSymbol.id)) {
            spanSymbol.vueKey = Date.now()
        }
    })
}


// 获取主符号
export function getMainMsSymbol(msSymbol: MsSymbol, musicScore: MusicScore): MsSymbol {
    const mainMsSymbol = getDataWithIndex(msSymbol.index, musicScore).msSymbol
    if (!mainMsSymbol) {
        console.error("获取主符号失败")
        return msSymbol
    }
    return mainMsSymbol
}

// 获取连音组信息
export function getBeamGroup(beamId: number, measure: Measure): BeamGroup {
    const res: BeamGroup = []
    if (beamId === -1) return []
    measure.msSymbolContainerArray.forEach((msSymbolContainer) => {
        msSymbolContainer.msSymbolArray.forEach((msSymbol) => {
            if (msSymbol.type === MsSymbolTypeEnum.noteHead && msSymbol.beamId === beamId) {

                const beamGroupItem: BeamGroupItem = {
                    beamId: msSymbol.beamId,
                    noteHead: msSymbol,
                    region: msSymbol.region,
                    chronaxie: msSymbol.chronaxie
                }
                res.push(beamGroupItem)
            }
        })
    })
    return res
}

// 获取next信息, nextCount，相对参数，表示获取target所在数组在target后nextCount位的数据
export function getNext(target: Exclude<MsType, SpanSymbol>, musicScore: MusicScore, nextCount: number = 1): Exclude<MsType, SpanSymbol> {
    if (!nextCount) {
        console.error("nextCount未传值，获取next失败")
    }
    if (nextCount < 0) {
        console.error("nextCount小于00，获取next失败")
    }
    if (nextCount === 0) return target
    const data = getDataWithIndex(target.index, musicScore)
    const msSymbol = data.msSymbol
    const msSymbolContainer = data.msSymbolContainer
    const measure = data.measure
    const singleStaff = data.singleStaff
    const multipleStaves = data.multipleStaves

    switch (target.msTypeName) {
        case MsTypeNameEnum.MsSymbol:
            if (!msSymbol || !msSymbolContainer) {
                console.error('索引符号或符号容器不存在，获取next信息失败')
                return target
            }
            if (msSymbolContainer.msSymbolArray.length < (target.index.msSymbolIndex + 1 + nextCount)) {
                return msSymbol
            } else {
                return msSymbolContainer.msSymbolArray[target.index.msSymbolIndex + nextCount]!
            }

        case MsTypeNameEnum.MsSymbolContainer:
            if (!msSymbolContainer || !measure) {
                console.error('索引符号容器或小节不存在，获取next信息失败')
                return target
            }
            if (measure.msSymbolContainerArray.length < (target.index.msSymbolContainerIndex + 1 + nextCount)) {
                return msSymbolContainer
            } else {
                return measure.msSymbolContainerArray[target.index.msSymbolContainerIndex + nextCount]!
            }

        case MsTypeNameEnum.Measure:
            if (!measure || !singleStaff) {
                console.error('索引小节或单谱表不存在，获取next信息失败')
                return target
            }
            if (singleStaff.measureArray.length < (target.index.measureIndex + 1 + nextCount)) {
                return measure
            } else {
                return singleStaff.measureArray[target.index.measureIndex + nextCount]!
            }

        case MsTypeNameEnum.SingleStaff:
            if (!singleStaff || !multipleStaves) {
                console.error('索引单谱表或复谱表不存在，获取next信息失败')
                return target
            }
            if (multipleStaves.singleStaffArray.length < (target.index.singleStaffIndex + 1 + nextCount)) {
                return singleStaff
            } else {
                return multipleStaves.singleStaffArray[target.index.singleStaffIndex + nextCount]!
            }

        case MsTypeNameEnum.MultipStaves:
            if (!multipleStaves || !musicScore.multipleStavesArray) {
                console.error('索引复谱表或乐谱不存在，获取next信息失败')
                return target
            }
            if (musicScore.multipleStavesArray.length < (target.index.multipleStavesIndex + 1 + nextCount)) {
                return multipleStaves
            } else {
                return musicScore.multipleStavesArray[target.index.multipleStavesIndex + nextCount]!
            }
        default:
            console.error("获取next异常，未知类型", target)
            return target
    }
}