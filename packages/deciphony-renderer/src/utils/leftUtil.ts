// 获取小节相对于musicScore组件的left
import type {
    IndexData,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MusicScore, NoteHead, NoteTail,
    SingleStaff
} from "../../../deciphony-core/src/types";
import {
    getBeamGroup,
    getDataWithIndex,
    getMainMsSymbol
} from "deciphony-core";
import {
    getMeasureWidth,
    getMsSymbolContainerWidth,
    getMsSymbolSlotWidth,
    getMsSymbolWidth, getNoteTailWidth,
    getWidthFixedContainerWidthSumInMeasure
} from "../utils/widthUtil";
import {
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum,
    MusicScoreShowModeEnum
} from "../../../deciphony-core/src/musicScoreEnum";
import {
    getWidthConstantInMeasure
} from "../utils/widthConstantUtil";
import {MsSymbolInformationMap} from "../constant";


export function getMeasureLeftToMusicScore(measure: Measure, musicScore: MusicScore, componentWidth: number): number {
    const indexData: IndexData = getDataWithIndex(measure.index, musicScore);
    if (indexData.singleStaff == null) {
        console.error('没有单谱表信息，无法计算小节left')
        return 0
    }
    let left = 0
    for (let curMeasure of indexData.singleStaff.measureArray) {
        if (curMeasure === measure) {
            return left
        }
        left += getMeasureWidth(curMeasure, indexData.singleStaff, musicScore, componentWidth)
    }
    return left

}

export function getNoteTailLeftToSlot(noteTail: NoteTail, noteHead: NoteHead, msSymbolContainer: MsSymbolContainer,
                                      measure: Measure, singleStaff: SingleStaff, musicScore: MusicScore, slotWidth: number,
                                      measureWidth: number, componentWidth: number): number {
    const measureHeight = musicScore.measureHeight

    if (!msSymbolContainer || !measure || !singleStaff) {
        console.error("数据索引有误，符尾left计算出错")
        return 0
    }
    const width = getMsSymbolWidth(noteTail, msSymbolContainer, measure,
        singleStaff, musicScore, componentWidth)
    const beamGroup = getBeamGroup(noteHead.beamId, measure)
    const noteStemInfo = MsSymbolInformationMap[MsSymbolTypeEnum.NoteStem]
    if (!('aspectRatio' in noteStemInfo) || typeof noteStemInfo.aspectRatio !== 'number') {
        console.error('符杠aspectRatio获取失败,符尾left计算出错')
        return 0
    }
    const noteStemWidth = measureHeight * noteStemInfo.heightMultiplier * noteStemInfo.aspectRatio
    if (beamGroup.length > 1) { // 成组情况
        // 如果是连音组首尾处音符
        if (noteHead.id === beamGroup[0].note.id) { // 头部
            if (noteTail.direction === 'up') {
                return slotWidth
            } else {
                return 0
            }
        } else if (noteHead.id === beamGroup[beamGroup.length - 1].note.id) { // 尾部
            if (noteTail.direction === 'up') {
                return -width + slotWidth
            } else {
                return -width
            }
        }
        const slotLeft = getSlotLeftToContainer(noteHead, msSymbolContainer, measure, singleStaff, musicScore, slotWidth,
            componentWidth)
        return -slotLeft
    } else { // 独立情况

        if (noteTail.direction === 'up') {
            return slotWidth
        } else {
            const noteStemInfo = MsSymbolInformationMap[MsSymbolTypeEnum.NoteStem]
            if (!('aspectRatio' in noteStemInfo) || typeof noteStemInfo.aspectRatio !== 'number') {
                console.error('符杠aspectRatio获取失败,符杠left计算出错')
                return 0
            }
            const noteStemWidth = measureHeight * noteStemInfo.heightMultiplier * noteStemInfo.aspectRatio
            return noteStemWidth

        }
    }


}

export function getMsSymbolLeftToSlot(msSymbol: MsSymbol, msSymbolContainer: MsSymbolContainer, measure: Measure, singleStaff: SingleStaff, musicScore: MusicScore, slotLeft: number, measureWidth: number,
                                      componentWidth: number, isMain: boolean = false): number {
    const mainMsSymbol = isMain ? msSymbol : getMainMsSymbol(msSymbol, musicScore)
    const slotWidth = getMsSymbolSlotWidth(msSymbol, musicScore)
    const width = getMsSymbolWidth(msSymbol, msSymbolContainer, measure,
        singleStaff, musicScore, componentWidth)
    switch (msSymbol?.type) {
        case MsSymbolTypeEnum.NoteHead: { // 音符头居中
            return 0
        }
        case MsSymbolTypeEnum.NoteStem: { // 音符头居中
            if (msSymbol.direction === 'up') {
                return slotWidth - width
            } else {
                return 0

            }
        }
        case MsSymbolTypeEnum.NoteTail: { // 音符头居中
            if (mainMsSymbol.type !== MsSymbolTypeEnum.NoteHead) {
                console.error("找不到音符头，符尾left计算出错")
                return 0
            }
            return getNoteTailLeftToSlot(msSymbol, mainMsSymbol, msSymbolContainer, measure, singleStaff, musicScore,
                slotWidth,
                measureWidth, componentWidth)

        }
        case MsSymbolTypeEnum.Accidental: { // 音符头居中
            return -width
        }
    }
    return 0
}

export function getSlotLeftToContainer(msSymbol: MsSymbol, msSymbolContainer: MsSymbolContainer, measure: Measure, singleStaff: SingleStaff,
                                       musicScore: MusicScore, slotWidth: number, componentWidth: number, isMain: boolean = false): number {
    const mainMsSymbol = isMain ? msSymbol : getMainMsSymbol(msSymbol, musicScore)
    const containerWidth = getMsSymbolContainerWidth(msSymbolContainer, measure, singleStaff, musicScore, componentWidth)
    const measureHeight = musicScore.measureHeight
    switch (mainMsSymbol?.type) {
        case MsSymbolTypeEnum.NoteHead: { // 音符头居中
            return containerWidth / 2 - slotWidth / 2
        }
        case MsSymbolTypeEnum.Rest: { // 休止符居中
            return containerWidth / 2 - slotWidth / 2
        }
    }
    return 0
}

export function getContainerLeftToMeasure(msSymbolContainer: MsSymbolContainer, measure: Measure,
                                          singleStaff: SingleStaff, musicScore: MusicScore, measureWidth: number) {
    const measureHeight = musicScore.measureHeight
    if (!msSymbolContainer || !measure || !singleStaff) {
        console.error("缺少必要的参数，坐标计算出错")
        return 0
    }
    let left = 0
    const containerType = msSymbolContainer.type
    if ([MsSymbolContainerTypeEnum.frontFixed].includes(containerType)) { // 如果是前置定宽容器 left = 当前符号之前的前置定宽容器的宽度
        left = getWidthFixedContainerWidthSumInMeasure(measure, measureHeight, musicScore.showMode, 'front', msSymbolContainer)
    } else if ([MsSymbolContainerTypeEnum.rearFixed].includes(containerType)) {// 如果是后置定宽容器 left =  小节宽度 - 小节定宽容器宽度 + 当前小节之前的定宽容器的宽度

        left = measureWidth - getWidthFixedContainerWidthSumInMeasure(measure, measureHeight, musicScore.showMode) + getWidthFixedContainerWidthSumInMeasure(measure, measureHeight, musicScore.showMode, 'all', msSymbolContainer)
    } else {  //变宽容器 （小节宽度 - 定宽容器宽度）/ 小节变宽容器宽度系数之和 * 截止当前容器小节的宽度系数之和 + 前置定宽容器宽度之和
        const widthFixedContainerWidthSumInMeasure = getWidthFixedContainerWidthSumInMeasure(measure, measureHeight, musicScore.showMode)
        const widthConstantInMeasure = getWidthConstantInMeasure(measure, musicScore.showMode)
        const preWidConstantInMeasure = getWidthConstantInMeasure(measure, musicScore.showMode, msSymbolContainer)
        const preWidthFixedContainerWidthSumInMeasure = getWidthFixedContainerWidthSumInMeasure(measure, measureHeight, musicScore.showMode, 'front')
        left = (measureWidth - widthFixedContainerWidthSumInMeasure) / widthConstantInMeasure * preWidConstantInMeasure + preWidthFixedContainerWidthSumInMeasure
        if (left === 50) {

        }
    }


    return left
}

export function getSlotLeftToMeasure(msSymbol: MsSymbol, msSymbolContainer: MsSymbolContainer,
                                     measure: Measure, singleStaff: SingleStaff, musicScore: MusicScore,
                                     slotWidth: number, measureWidth: number, componentWidth: number, showMode: MusicScoreShowModeEnum, isMain: boolean = false) {
    const mainMsSymbol = isMain ? msSymbol : getMainMsSymbol(msSymbol, musicScore)
    const slotLeftToContainer = getSlotLeftToContainer(mainMsSymbol, msSymbolContainer, measure, singleStaff,
        musicScore, slotWidth, componentWidth)
    const containerLeftToMeasure = getContainerLeftToMeasure(msSymbolContainer, measure, singleStaff,
        musicScore, measureWidth)
    return slotLeftToContainer + containerLeftToMeasure

}