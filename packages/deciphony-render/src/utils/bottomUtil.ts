// 五线谱区域转换bottom
import {MsSymbolTypeEnum, MusicScoreShowModeEnum} from "../../../deciphony-core/src/musicScoreEnum";
import {
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MusicScore,
    NoteStem,
    SingleStaff,
    StaffRegion
} from "../../../deciphony-core/src/types";
import {getMsSymbolHeight} from "./heightUtil";
import {getDataWithIndex, staffRegionToIndex, traverseMusicScore} from "deciphony-core/utils/musicScoreDataUtil";

export function staffRegionToBottom(region: StaffRegion, measureHeight: number): number {
    return measureHeight * ((staffRegionToIndex(region) - 1) * 2) / 16
}

// 获取符号在符号槽位中的相对bottom。
export function getMsSymbolBottomToSlot(msSymbol: MsSymbol, musicScore: MusicScore, showMode: MusicScoreShowModeEnum): number {
    const parentMsSymbol = getDataWithIndex(msSymbol.index, musicScore).msSymbol
    const measureHeight = musicScore.measureHeight
    switch (msSymbol?.type) {
        case MsSymbolTypeEnum.NoteStem: {
            if (msSymbol.direction === 'up') {
                return measureHeight / 8

            } else {
                const height = getMsSymbolHeight(msSymbol, musicScore, showMode)
                return -height + measureHeight / 8

            }
        }
        case MsSymbolTypeEnum.NoteTail: { // 符尾的
            const slotBottom = getSlotBottomToMeasure(msSymbol, musicScore, showMode)
            const noteStem = parentMsSymbol?.msSymbolArray.find((item) => item.type === MsSymbolTypeEnum.NoteStem) as NoteStem | null
            if (!noteStem) {
                console.error("找不到符杠，符尾bottom计算失败")
                return 0
            }
            const noteStemOffset = measureHeight * 1 / 8 // 符杠相对slot的偏差
            const height = getMsSymbolHeight(msSymbol, musicScore, showMode)
            const noteStemHeight = getMsSymbolHeight(noteStem, musicScore, showMode)

            if (msSymbol.direction === 'up') {
                return noteStemHeight - height + noteStemOffset
            } else {
                return -noteStemHeight + noteStemOffset
            }
        }
        default: {
            return 0
        }
    }
}

// 获取符号槽位在符号容器中的相对bottom。因为MsSymbolContainer的y轴位置及高度都是等同于measure的，所以这个bottom等同于相对measure的bottom
export function getSlotBottomToMeasure(msSymbol: MsSymbol, musicScore: MusicScore, showMode: MusicScoreShowModeEnum): number {
    if (!msSymbol) return 0
    const measureHeight = musicScore.measureHeight
    // 未防止传入跟随符号，需要经过下面一行转换
    const targetMsSymbol = getDataWithIndex(msSymbol.index, musicScore)?.msSymbol as MsSymbol
    switch (targetMsSymbol.type) {
        case MsSymbolTypeEnum.NoteHead: {
            if (!targetMsSymbol) return 0
            if (showMode === MusicScoreShowModeEnum.numberNotation) return 0
            const noteRegion: StaffRegion = targetMsSymbol.region
            return staffRegionToBottom(noteRegion, measureHeight)
        }
        default: {
            return 0
        }

    }
}

// 获取符号容器内最高的单小节符号bottom + 符号高度  不考虑符号跟随型符号
export function getMaxMsSymbolBottomInMsSymbolContainer(msSymbolContainer: MsSymbolContainer, musicScore: MusicScore, showMode: MusicScoreShowModeEnum, plusHeight = true): number {
    let maxBottom = 0
    const measureHeight = musicScore.measureHeight
    for (let msSymbol of msSymbolContainer.msSymbolArray) {
        const bottom = getSlotBottomToMeasure(msSymbol, musicScore, showMode)
        const height = getMsSymbolHeight(msSymbol, musicScore, showMode)
        const max = bottom + height

        if (plusHeight) {
            maxBottom = Math.max(max, maxBottom)
        } else {
            maxBottom = Math.max(bottom, maxBottom)
        }

    }
    return maxBottom
}

// 获取符号容器内最低的单小节符号bottom
export function getMinMsSymbolBottomInMsSymbolContainer(msSymbolContainer: MsSymbolContainer, musicScore: MusicScore, showMode: MusicScoreShowModeEnum) {
    let minBottom = 10000
    for (let msSymbol of msSymbolContainer.msSymbolArray) {
        const bottom = getSlotBottomToMeasure(msSymbol, musicScore, showMode)
        minBottom = Math.min(bottom, minBottom)
    }
    return minBottom
}

// 获取小节内最高的单小节符号bottom + 符号高度
export function getMaxMsSymbolBottomInMeasure(measure: Measure, musicScore: MusicScore, showMode: MusicScoreShowModeEnum, plusHeight = true) {
    let maxBottom = 0
    for (let msSymbol of measure.msSymbolContainerArray) {
        const bottom = getMaxMsSymbolBottomInMsSymbolContainer(msSymbol, musicScore, showMode, plusHeight)
        maxBottom = Math.max(bottom, maxBottom)
    }
    return maxBottom
}

// 获取小节内最低的单小节符号bottom
export function getMinMsSymbolBottomInMeasure(measure: Measure, musicScore: MusicScore, showMode: MusicScoreShowModeEnum) {
    let minBottom = 10000
    for (let msSymbolContainer of measure.msSymbolContainerArray) {
        const bottom = getMinMsSymbolBottomInMsSymbolContainer(msSymbolContainer, musicScore, showMode)
        minBottom = Math.min(bottom, minBottom)
    }
    return minBottom
}

// 获取单谱表内最高的单小节符号bottom + 符号高度
export function getMaxMsSymbolBottomInSingleStaff(singleStaff: SingleStaff, musicScore: MusicScore, showMode: MusicScoreShowModeEnum, plusHeight = true) {
    let maxBottom = 0
    for (let measure of singleStaff.measureArray) {
        const bottom = getMaxMsSymbolBottomInMeasure(measure, musicScore, showMode, plusHeight)
        maxBottom = Math.max(bottom, maxBottom)
    }
    return maxBottom
}

// 获取单谱表内最低的单小节符号bottom
export function getMinMsSymbolBottomInSingleStaff(singleStaff: SingleStaff, musicScore: MusicScore, showMode: MusicScoreShowModeEnum) {
    let minBottom = 10000
    for (let measure of singleStaff.measureArray) {
        const bottom = getMinMsSymbolBottomInMeasure(measure, musicScore, showMode)
        minBottom = Math.min(bottom, minBottom)
    }
    return minBottom
}

// 获取小节相对于musicScore组件的bottom
export function getMeasureBottomToMusicScore(measure: Measure, musicScore: MusicScore, componentHeight: number): number {
    let top = 0

    traverseMusicScore(musicScore, {
        level: 'multipleStaves',
        order: 'asc',
        callback: ({multipleStaves}) => {
            if (!multipleStaves) return true
            top += multipleStaves.multipleStavesPaddingTop
            for (let curSingleStaff of multipleStaves.singleStaffArray) {
                top += curSingleStaff.singleStaffPaddingTop + musicScore.measureHeight
                for (let curMeasure of curSingleStaff.measureArray) {
                    if (curMeasure === measure) {
                        return true
                    }
                }
                top += curSingleStaff.singleStaffPaddingBottom + curSingleStaff.singleStaffMarginBottom
            }
            top += multipleStaves.multipleStavesPaddingBottom + multipleStaves.multipleStavesMarginBottom
            return false
        }

    })
    return componentHeight - top
}