// 五线谱区域转换bottom
import {
    MsSymbolTypeEnum, MusicScoreShowModeEnum,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MusicScore,
    NoteStem,
    SingleStaff,
    StaffRegion,
    MultipleStaves,
    getDataWithIndex, staffRegionToIndex, traverseMusicScore, getMainMsSymbol
} from "deciphony-core";
import {getMsSymbolHeight} from "./heightUtil";
import {MsSymbolInformationMap} from "@/constant";
import {MsSymbolInformation, VariableWidthSymbolInfo} from "@/types";
import {getHeightMultiplier, getSpace} from "@/utils/geometryUtil";
import {forEachMsSymbolContainer} from "../../../deciphony-core/src";

export function staffRegionToTop(region: StaffRegion, measureHeight: number): number {
    return measureHeight * ((7 - staffRegionToIndex(region)) * 2) / 16
}

// 获取符号在符号槽位中的相对bottom。
export function getMsSymbolTopToSlot(msSymbol: MsSymbol, musicScore: MusicScore): number {
    const parentMsSymbol = getDataWithIndex(msSymbol.index, musicScore).msSymbol
    const measureHeight = musicScore.measureHeight
    switch (msSymbol?.type) {
        case MsSymbolTypeEnum.NoteStem: {
            if (msSymbol.direction === 'up') {
                const height = getMsSymbolHeight(msSymbol, musicScore)
                return -height + measureHeight / 8
            } else {
                return measureHeight / 8
            }
        }
        case MsSymbolTypeEnum.NoteTail: { // 符尾的
            const slotBottom = getSlotTopToMeasure(msSymbol, musicScore)
            const noteStem = parentMsSymbol?.msSymbolArray.find((item) => item.type === MsSymbolTypeEnum.NoteStem) as NoteStem | null
            if (!noteStem) {
                console.error("找不到符杠，符尾bottom计算失败")
                return measureHeight
            }
            const noteStemOffset = measureHeight * 1 / 8 // 符杠相对slot的偏差
            const height = getMsSymbolHeight(msSymbol, musicScore)
            const noteStemHeight = getMsSymbolHeight(noteStem, musicScore)

            if (msSymbol.direction === 'up') {
                return (-noteStemHeight + noteStemOffset)
            } else {
                return noteStemHeight + noteStemOffset - height
            }
        }
        case MsSymbolTypeEnum.NoteDot: {
            const information = MsSymbolInformationMap[MsSymbolTypeEnum.NoteDot] as VariableWidthSymbolInfo
            const bSpace = getSpace(msSymbol, musicScore).bottom
            const tSpace = getSpace(msSymbol, musicScore).top
            // 如果有减时线，需要加上减时线的高度
            const mainMsSymbol = getMainMsSymbol(msSymbol, musicScore)
            let chronaxieReducingLineHeight = 0
            const chronaxieReducingLine = mainMsSymbol.msSymbolArray.find((item) => item.type === MsSymbolTypeEnum.ChronaxieReducingLine)
            // 减时线的下间距
            let bChronaxieReducingLineSpace = 0
            if (chronaxieReducingLine) {
                bChronaxieReducingLineSpace = getSpace(chronaxieReducingLine, musicScore).bottom
                chronaxieReducingLineHeight = getMsSymbolHeight(chronaxieReducingLine, musicScore)
            }
            if ([0, 1, 2, 3].includes(msSymbol.octave)) {
                const height = getMsSymbolHeight(msSymbol, musicScore)

                return measureHeight - (-height - bSpace - chronaxieReducingLineHeight - bChronaxieReducingLineSpace)
            } else if ([5, 6, 7, 8].includes(msSymbol.octave)) {
                return tSpace
            }
            return measureHeight
        }
        case MsSymbolTypeEnum.ChronaxieIncreasingLine: {
            const information = MsSymbolInformationMap[MsSymbolTypeEnum.ChronaxieIncreasingLine] as VariableWidthSymbolInfo
            const heightMultiplier = information.heightMultiplier as number
            const height = heightMultiplier * measureHeight
            // 居中写法
            return measureHeight + -(measureHeight / 2 - height / 2)
        }
        case MsSymbolTypeEnum.ChronaxieReducingLine: {
            const information = MsSymbolInformationMap[MsSymbolTypeEnum.ChronaxieReducingLine] as VariableWidthSymbolInfo
            const heightMultiplier = getHeightMultiplier(msSymbol)
            const bSpace = getSpace(msSymbol, musicScore).bottom
            const height = heightMultiplier * measureHeight
            // 居中写法
            return measureHeight - (-height - bSpace)
        }
        default: {
            return 0
        }
    }
}

// 获取符号槽位在符号容器中的相对top。因为MsSymbolContainer的y轴位置及高度都是等同于measure的，所以这个top等同于相对measure的top
export function getSlotTopToMeasure(msSymbol: MsSymbol, musicScore: MusicScore): number {
    if (!msSymbol) return 0
    const measureHeight = musicScore.measureHeight
    // 未防止传入跟随符号，需要经过下面一行转换
    const targetMsSymbol = getDataWithIndex(msSymbol.index, musicScore)?.msSymbol as MsSymbol
    switch (targetMsSymbol.type) {
        case MsSymbolTypeEnum.NoteHead: {
            if (!targetMsSymbol) return 0
            if (musicScore.showMode === MusicScoreShowModeEnum.numberNotation) return 0
            const noteRegion: StaffRegion = targetMsSymbol.region
            return staffRegionToTop(noteRegion, measureHeight)
        }
        default: {
            return 0
        }

    }
}

// 获取符号容器内最高的单小节符号top   不考虑符号跟随型符号
export function getMaxMsSymbolTopInMsSymbolContainer(msSymbolContainer: MsSymbolContainer, musicScore: MusicScore, plusHeight = true): number {
    let maxTop = 0
    const measureHeight = musicScore.measureHeight
    for (let msSymbol of msSymbolContainer.msSymbolArray) {
        const top = getSlotTopToMeasure(msSymbol, musicScore)
        //
        const max = top

        if (plusHeight) {
            maxTop = Math.max(max, maxTop)
        } else {
            maxTop = Math.max(top, maxTop)
        }

    }
    return maxTop
}

// 获取符号容器内最低的单小节符号top + 符号高度
export function getMinMsSymbolTopInMsSymbolContainer(msSymbolContainer: MsSymbolContainer, musicScore: MusicScore) {
    let minTop = 10000
    // const height = getMsSymbolHeight(msSymbol, musicScore)
    for (let msSymbol of msSymbolContainer.msSymbolArray) {
        const top = getSlotTopToMeasure(msSymbol, musicScore)
        let childTop = 0
        if (msSymbol.msSymbolArray) {
            for (let childMsSymbol of msSymbol.msSymbolArray) {
                childTop = Math.min(childTop, getMsSymbolTopToSlot(childMsSymbol, musicScore))
            }
        }
        minTop = Math.min(top + childTop, minTop)
    }
    return minTop
}

// 获取两个符号之间最低的单小节符号top
export function getMinMsSymbolTopBetweenMsSymbolContainer(startMsSymbolContainer: MsSymbolContainer, endMsSymbolContainer: MsSymbolContainer, musicScore: MusicScore) {
    let top = 10000
    forEachMsSymbolContainer(startMsSymbolContainer, endMsSymbolContainer, musicScore, (msSymbolContainer) => {
        const minTop = getMinMsSymbolTopInMsSymbolContainer(msSymbolContainer, musicScore)
        top = Math.min(top, minTop)
    })
    return top
}

// 获取小节内最高的单小节符号top
export function getMaxMsSymbolTopInMeasure(measure: Measure, musicScore: MusicScore, plusHeight = true) {
    let maxTop = 0
    for (let msSymbol of measure.msSymbolContainerArray) {
        const top = getMaxMsSymbolTopInMsSymbolContainer(msSymbol, musicScore, plusHeight)
        maxTop = Math.max(top, maxTop)
    }
    return maxTop
}

// 获取小节内最低的单小节符号top
export function getMinMsSymbolTopInMeasure(measure: Measure, musicScore: MusicScore) {
    let minTop = 10000
    for (let msSymbolContainer of measure.msSymbolContainerArray) {
        const top = getMinMsSymbolTopInMsSymbolContainer(msSymbolContainer, musicScore)
        minTop = Math.min(top, minTop)
    }
    return minTop
}

// 获取单谱表内最高的单小节符号top
export function getMaxMsSymbolTopInSingleStaff(singleStaff: SingleStaff, musicScore: MusicScore, plusHeight = true) {
    let maxTop = 0
    for (let measure of singleStaff.measureArray) {
        const top = getMaxMsSymbolTopInMeasure(measure, musicScore, plusHeight)
        maxTop = Math.max(top, maxTop)
    }
    return maxTop
}

// 获取单谱表内最低的单小节符号top
export function getMinMsSymbolTopInSingleStaff(singleStaff: SingleStaff, musicScore: MusicScore) {
    let minTop = 10000
    for (let measure of singleStaff.measureArray) {
        const top = getMinMsSymbolTopInMeasure(measure, musicScore)
        minTop = Math.min(top, minTop)
    }
    return minTop
}

// 获取小节相对于musicScore组件的top
export function getMeasureTopToMusicScore(measure: Measure, musicScore: MusicScore, componentHeight: number): number {
    let top = 0

    traverseMusicScore(musicScore, {
        level: 'multipleStaves',
        order: 'asc',
        callback: ({multipleStaves}) => {
            if (!multipleStaves) return true
            top += multipleStaves.multipleStavesPaddingTop
            for (let curSingleStaff of multipleStaves.singleStaffArray) {
                top += curSingleStaff.singleStaffPaddingTop
                for (let curMeasure of curSingleStaff.measureArray) {
                    if (curMeasure === measure) {
                        return true
                    }
                }
                top += curSingleStaff.singleStaffPaddingBottom + curSingleStaff.singleStaffMarginBottom + musicScore.measureHeight
            }
            top += multipleStaves.multipleStavesPaddingBottom + multipleStaves.multipleStavesMarginBottom
            return false
        }

    })
    return top
}