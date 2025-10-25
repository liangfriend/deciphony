import {
    AccidentalEnum,
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolTypeEnum,
    MsTypeNameEnum,
    StaffPositionTypeEnum,
    StaffRegionEnum,
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
    NoteName,
    NoteNumber,
    NoteString,
    SingleStaff,
    SpanSymbol,
    StaffRegion
} from "../types";


export function noteNameToNoteString(noteName: NoteName): NoteString {
    return `${noteName.letter}${noteName.accidental}${noteName.octave}`
}

// 科学音调记号法转赫尔姆霍兹音调记号法
export function noteNameToHelmholtz(noteName: NoteName): string {
    const {letter, accidental, octave} = noteName

    // 变音符
    let accidentalSymbol = ''
    switch (accidental) {
        case AccidentalEnum.Sharp:
            accidentalSymbol = '♯'
            break
        case AccidentalEnum.Flat:
            accidentalSymbol = '♭'
            break
        case AccidentalEnum.DoubleSharp:
            accidentalSymbol = '𝄪'
            break
        case AccidentalEnum.DoubleFlat:
            accidentalSymbol = '𝄫'
            break
        case AccidentalEnum.None:
            accidentalSymbol = ''
            break
    }

    // 上标/下标映射
    const superscriptMap: Record<number, string> = {
        0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'
    }
    const subscriptMap: Record<number, string> = {
        0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉'
    }

    let noteSymbol = ''

    if (octave <= 2) {
        // 大字组
        noteSymbol = letter.toUpperCase()
        const digits = String(Math.abs(octave - 3))
            .split('')
            .map(d => subscriptMap[Number(d)])
            .join('')
        noteSymbol += digits
    } else {
        // 小字组
        noteSymbol = letter.toLowerCase()
        if (octave >= 4) {
            // 小字一组及以上 -> 上标 (octave-3)
            const upperNum = octave - 3
            const digits = String(upperNum)
                .split('')
                .map(d => superscriptMap[Number(d)])
                .join('')
            noteSymbol += digits
        }
        // octave 3 不加任何标
    }

    // ✅ 修正：将变音符放在音名之后
    return noteSymbol.slice(0, 1) + accidentalSymbol + noteSymbol.slice(1)
}


// 是否有符尾（flag）
export function hasNoteTail(chronaxie: ChronaxieEnum): boolean {
    // 八分音符及更短时值才有符尾
    return chronaxie >= ChronaxieEnum.eighth;
}

// 是否有符杠（stem）
export function hasNoteStem(chronaxie: ChronaxieEnum): boolean {
    // 全音符没有符杠，其他都有
    return chronaxie !== ChronaxieEnum.whole;
}

// 获取音符的变音符号
export function getMsSymbolAccidental(noteHead: NoteHead | NoteNumber, musicScore: MusicScore): {
    accidental: AccidentalEnum,
    measureAccidental: AccidentalEnum
} {
    let accidental: AccidentalEnum = AccidentalEnum.None
    if (!noteHead.msSymbolArray) {
        return {
            accidental,
            measureAccidental: AccidentalEnum.None
        }
    }
    const msData = getDataWithIndex(noteHead.index, musicScore)
    const msSymbolContainer = msData.msSymbolContainer
    const measure = msData.measure
    const singleStaff = msData.singleStaff

    const measureIndex = measure?.index.measureIndex
    const msSymbolContainerIndex = msSymbolContainer?.index.msSymbolContainerIndex

    if (!msSymbolContainer || !measure || !singleStaff || (msSymbolContainerIndex == null) || (measureIndex == null)) {
        console.error("索引数据查找出错，获取符号的谱号失败")
        return {
            accidental,
            measureAccidental: AccidentalEnum.None
        }
    }
    let measureAccidental: AccidentalEnum = AccidentalEnum.None
    for (let i = (measureIndex); i >= 0; i--) {
        const curMeasure = singleStaff.measureArray[i];
        if (i === measureIndex) {
            for (let j = msSymbolContainerIndex; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.Accidental === curMsSymbol.type) {
                    measureAccidental = curMsSymbol.accidental
                    break
                }
            }
        } else {
            for (let j = curMeasure.msSymbolContainerArray.length - 1; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.Accidental === curMsSymbol.type) {
                    measureAccidental = curMsSymbol.accidental
                    break
                }
            }
        }
    }
    for (let item of noteHead.msSymbolArray) {
        if (item.type === MsSymbolTypeEnum.Accidental) {
            accidental = item.accidental
            return {accidental, measureAccidental}
        }
    }

    return {accidental, measureAccidental}
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
                if (MsSymbolTypeEnum.KeySignature === curMsSymbol.type) {
                    return curMsSymbol.keySignature
                }
            }
        } else {
            for (let j = curMeasure.msSymbolContainerArray.length - 1; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.KeySignature === curMsSymbol.type) {
                    return curMsSymbol.keySignature
                }
            }
        }


    }
    return KeySignatureEnum.C
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
        return ClefEnum.Treble
    }
    for (let i = (measureIndex); i >= 0; i--) {
        const curMeasure = singleStaff.measureArray[i];
        if (i === measureIndex) {
            for (let j = msSymbolContainerIndex; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.Clef === curMsSymbol.type || MsSymbolTypeEnum.Clef_f === curMsSymbol.type) {
                    return curMsSymbol.clef
                }
            }
        } else {
            for (let j = curMeasure.msSymbolContainerArray.length - 1; j >= 0; j--) {
                const curMsSymbolContainer = curMeasure.msSymbolContainerArray[j]
                const curMsSymbol = curMsSymbolContainer.msSymbolArray[0]
                if (MsSymbolTypeEnum.Clef === curMsSymbol.type || MsSymbolTypeEnum.Clef_f === curMsSymbol.type) {
                    return curMsSymbol.clef
                }
            }
        }


    }
    return ClefEnum.Treble
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

/**
 * 将五线谱位置 (StaffRegion) 映射到整数坐标
 */
export function staffRegionToIndex(pos: StaffRegion): number {
    // 主体区域 (main): line1=0, space1=1, line2=2, ...
    if (pos.region === StaffRegionEnum.Main) {
        return (pos.index - 1) * 2 + (pos.type === StaffPositionTypeEnum.Space ? 1 : 0);
    }

    // 下方区域 (lower): line1=-2, space1=-1, line2=-4, space2=-3, ...
    if (pos.region === StaffRegionEnum.Lower) {
        return -(pos.index * 2) + (pos.type === StaffPositionTypeEnum.Space ? 1 : 0);
    }

    // 上方区域 (upper): 第五线=8, 第五间=9
    // 所以 line1=10, space1=11, line2=12, space2=13 ...
    if (pos.region === StaffRegionEnum.Upper) {
        return 8 + (pos.index * 2) + (pos.type === StaffPositionTypeEnum.Space ? 1 : 0);
    }

    throw new Error("Invalid StaffRegion");
}

/**
 * 将整数坐标转换回五线谱位置 (StaffRegion)
 */
export function indexToStaffRegion(index: number): StaffRegion {
    // 主体区域: 0 ~ 9
    if (index >= 0 && index <= 9) {
        const type = index % 2 === 0 ? StaffPositionTypeEnum.Line : StaffPositionTypeEnum.Space;
        const lineIndex = Math.floor(index / 2) + 1; // 1~5
        const spaceIndex = Math.floor(index / 2) + 1; // 1~4
        return {
            region: StaffRegionEnum.Main,
            type,
            index: type === StaffPositionTypeEnum.Line ? lineIndex : spaceIndex,
        };
    }

    // 下方区域: 负数
    if (index < 0) {
        const abs = Math.abs(index);
        const type = abs % 2 === 0 ? StaffPositionTypeEnum.Line : StaffPositionTypeEnum.Space;
        const posIndex = Math.floor((abs + 1) / 2);
        return {
            region: StaffRegionEnum.Lower,
            type,
            index: posIndex,
        };
    }

    // 上方区域: >=10
    if (index >= 10) {
        const rel = index - 10; // 从上加一线开始
        const type = rel % 2 === 0 ? StaffPositionTypeEnum.Line : StaffPositionTypeEnum.Space;
        const posIndex = Math.floor(rel / 2) + 1;
        return {
            region: StaffRegionEnum.Upper,
            type,
            index: posIndex,
        };
    }

    throw new Error("Invalid index for StaffRegion");
}

// 判断direction
export function judgeDirection(region: number | StaffRegion): 'up' | 'down' {
    if (typeof region === 'number') {
        if (region <= 3) {
            return 'up'
        } else {
            return 'down'
        }
    } else {
        if (staffRegionToIndex(region) <= 3) {
            return 'up'
        } else {
            return 'down'
        }
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
            if (msSymbol.type === MsSymbolTypeEnum.NoteHead && msSymbol.beamId === beamId) {

                const beamGroupItem: BeamGroupItem = {
                    beamId: msSymbol.beamId,
                    note: msSymbol,
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

// 符号进行替换时，对必要属性进行继承
export function msSymbolPropertiesInherit(newMsSymbol: MsSymbol, oldMsSymbol: MsSymbol) {
    newMsSymbol.id = oldMsSymbol.id;
    newMsSymbol.bindingEndId = oldMsSymbol.bindingEndId;
    newMsSymbol.bindingStartId = oldMsSymbol.bindingStartId;
}

// 循环符号容器
export function forEachMsSymbolContainer(
    startMsSymbolContainer: MsSymbolContainer,
    endMsSymbolContainer: MsSymbolContainer,
    musicScore: MusicScore,
    callback: (container: MsSymbolContainer) => void
) {
    if (!startMsSymbolContainer || !endMsSymbolContainer || !musicScore) return;

    const start = startMsSymbolContainer.index;
    const end = endMsSymbolContainer.index;

    // 为了支持反向的情况（start > end）
    const isReverse = compareIndexOrder(start, end) > 0;

    const multipleStavesArray = musicScore.multipleStavesArray;

    const startM = Math.min(start.multipleStavesIndex, end.multipleStavesIndex);
    const endM = Math.max(start.multipleStavesIndex, end.multipleStavesIndex);

    // 遍历复谱表区间
    for (let m = startM; m <= endM; m++) {
        const multiple = multipleStavesArray[m];
        const singleArray = multiple.singleStaffArray;

        const singleStart = m === start.multipleStavesIndex ? start.singleStaffIndex : 0;
        const singleEnd = m === end.multipleStavesIndex ? end.singleStaffIndex : singleArray.length - 1;

        for (let s = singleStart; s <= singleEnd; s++) {
            const single = singleArray[s];
            const measureArray = single.measureArray;

            const measureStart =
                m === start.multipleStavesIndex && s === start.singleStaffIndex
                    ? start.measureIndex
                    : 0;

            const measureEnd =
                m === end.multipleStavesIndex && s === end.singleStaffIndex
                    ? end.measureIndex
                    : measureArray.length - 1;

            for (let j = measureStart; j <= measureEnd; j++) {
                const measure = measureArray[j];
                const containerArray = measure.msSymbolContainerArray;

                const containerStart =
                    m === start.multipleStavesIndex &&
                    s === start.singleStaffIndex &&
                    j === start.measureIndex
                        ? start.msSymbolContainerIndex
                        : 0;

                const containerEnd =
                    m === end.multipleStavesIndex &&
                    s === end.singleStaffIndex &&
                    j === end.measureIndex
                        ? end.msSymbolContainerIndex
                        : containerArray.length - 1;

                for (let k = containerStart; k <= containerEnd; k++) {
                    const container = containerArray[k];
                    callback(container);
                }
            }
        }
    }
}

// 辅助函数，比较索引顺序
function compareIndexOrder(a: MusicScoreIndex, b: MusicScoreIndex): number {
    if (a.multipleStavesIndex !== b.multipleStavesIndex)
        return a.multipleStavesIndex - b.multipleStavesIndex;
    if (a.singleStaffIndex !== b.singleStaffIndex)
        return a.singleStaffIndex - b.singleStaffIndex;
    if (a.measureIndex !== b.measureIndex)
        return a.measureIndex - b.measureIndex;
    return a.msSymbolContainerIndex - b.msSymbolContainerIndex;
}