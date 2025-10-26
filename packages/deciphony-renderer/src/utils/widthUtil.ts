import {
    getBeamGroup,
    getDataWithIndex,
    getMainMsSymbol,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum,
    MusicScore,
    MusicScoreShowModeEnum,
    NoteHead,
    NoteTail,
    SingleStaff
} from "deciphony-core";
import {MsSymbolInformationMap,} from "@/constant";
import {
    getWidthConstantInMeasure,
    getWidthConstantInMsSymbolContainer,
    getWidthConstantInSingleStaff
} from "./widthConstantUtil";
import {getMsSymbolHeight} from "./heightUtil";
import {getHeightMultiplier, getMsSymbolAspectRatio} from "./geometryUtil";


// 获取定宽容器的宽度
export function getWidthFixedContainerWidth(msSymbolContainer: MsSymbolContainer, measureHeight: number): number {
    let width = 0
    for (let i = 0; i < msSymbolContainer.msSymbolArray.length; i++) {
        const curMsSymbol: MsSymbol = msSymbolContainer.msSymbolArray[i]
        const information = MsSymbolInformationMap[curMsSymbol.type]
        let curW = 0
        if ('aspectRatio' in information && (typeof information.aspectRatio === 'number')) {
            curW += information.aspectRatio * measureHeight
        } else if ('aspectRatio' in information && (typeof information.aspectRatio === 'object')) { // 特殊情况处理
            if (curMsSymbol.type === MsSymbolTypeEnum.KeySignature) {
                curW += information.aspectRatio[curMsSymbol.keySignature] * measureHeight
            } else if (curMsSymbol.type === MsSymbolTypeEnum.BarLine || curMsSymbol.type === MsSymbolTypeEnum.BarLine_f) {
                curW += information.aspectRatio[curMsSymbol.barLineType] * measureHeight
            } else if (curMsSymbol.type === MsSymbolTypeEnum.Clef || curMsSymbol.type === MsSymbolTypeEnum.Clef_f) {
                curW += information.aspectRatio[curMsSymbol.clef] * measureHeight
            }
        } else {
            console.error('符号的svg宽高比不存在')
        }
        if (width < curW) {
            width = curW
        }

    }
    return width
}

// 获取符号容器宽度
export function getMsSymbolContainerWidth(msSymbolContainer: MsSymbolContainer, measure: Measure, singleStaff: SingleStaff, musicScore: MusicScore, componentWidth: number): number {
    const measureHeight = musicScore.measureHeight
    if (!msSymbolContainer || !measure) {
        console.error("缺少必要的参数，坐标计算出错")
        return 0
    }
    let width: number = 0 // 定宽容器的宽度等于主符号宽度（通过调用符号组件暴露的获取宽高比方法获取宽高比），非定宽容器宽度通过计算宽度系数设置
    const containerType = msSymbolContainer.type
    if ([MsSymbolContainerTypeEnum.frontFixed, MsSymbolContainerTypeEnum.rearFixed].includes(containerType)) { // 如果是定宽容器
        width = getWidthFixedContainerWidth(msSymbolContainer, measureHeight)
    } else { // 如果是变宽容器  宽度 = (小节宽度 - 定宽容器宽度) / 变宽容器宽度系数和 * 当前容器宽度系数
        const fixedSymbolContainerSum = getWidthFixedContainerWidthSumInMeasure(measure, measureHeight)
        const totalWidthConstantOfFixedContainerInMeasure = getWidthConstantInMeasure(measure)
        const curMsSymbolContainerWidthConstant = getWidthConstantInMsSymbolContainer(msSymbolContainer)
        const measureWidth = getMeasureWidth(measure, singleStaff, musicScore, componentWidth)
        width = (measureWidth - fixedSymbolContainerSum) / totalWidthConstantOfFixedContainerInMeasure * curMsSymbolContainerWidthConstant
    }
    return width
}

// 获取小节宽度
export function getMeasureWidth(measure: Measure, singleStaff: SingleStaff, musicScoreData: MusicScore, componentWidth: number) {

    const totalSingleStaffWidthConstant = getWidthConstantInSingleStaff(singleStaff, musicScoreData.showMode); // 获取单谱表宽度系数和
    const totalMeasureWidthConstant = getWidthConstantInMeasure(measure); // 获取小节宽度系数和
    const fixedContainerWidthInSngleStaff = getWidthFixedContainerWidthSumInSingleStaff(singleStaff, musicScoreData.measureHeight) // 单谱表内定宽容器宽度
    const fixedContainerWidthInMeasure = getWidthFixedContainerWidthSumInMeasure(measure, musicScoreData.measureHeight) // 小节定宽容器宽度
    const measureLength = singleStaff.measureArray.length // 单谱表内小节数量
    const totalVariableContainerWidth = (componentWidth - fixedContainerWidthInSngleStaff) // 变宽容器总宽度
    const widthPerWidthConstant = totalVariableContainerWidth / totalSingleStaffWidthConstant * musicScoreData.widthDynamicRatio // 每宽度常亮的宽度
    const fixedWidth = totalVariableContainerWidth * (1 - musicScoreData.widthDynamicRatio) / measureLength   // 小节内就算没有变宽符号也要分配一定宽度，这里是计算出来每个小节固定分出来的宽度
    // 这里对小节的计算，如果小节没有符号，会出现常数系数为0，导致错误，不过小节至少会有一个结束小节线不会被删除，所以暂时没有处理也没有问题
    return widthPerWidthConstant * totalMeasureWidthConstant + fixedContainerWidthInMeasure + fixedWidth;
}

// 获取当前小节内定宽符号容器宽度之和
export function getWidthFixedContainerWidthSumInMeasure(measure: Measure, measureHeight: number, filter: 'front' | 'rear' | 'all' = 'all', msSymbolContainer?: MsSymbolContainer): number {
    let widthSum = 0
    for (let i = 0; i < measure.msSymbolContainerArray.length; i++) {
        const curMsSymbolContainer: MsSymbolContainer = measure.msSymbolContainerArray[i]

        if (msSymbolContainer && msSymbolContainer === curMsSymbolContainer) {
            return widthSum
        }
        const containerType = curMsSymbolContainer.type
        if (filter === 'all' && [MsSymbolContainerTypeEnum.frontFixed, MsSymbolContainerTypeEnum.rearFixed].includes(containerType)) {
            widthSum += getWidthFixedContainerWidth(curMsSymbolContainer, measureHeight)
        } else if (filter === 'front' && [MsSymbolContainerTypeEnum.frontFixed].includes(containerType)) {
            widthSum += getWidthFixedContainerWidth(curMsSymbolContainer, measureHeight)
        } else if (filter === 'rear' && [MsSymbolContainerTypeEnum.rearFixed].includes(containerType)) {
            widthSum += getWidthFixedContainerWidth(curMsSymbolContainer, measureHeight)
        }

    }
    return widthSum
}


// 获取单谱表内定宽容器符号宽度之和，单位px
export function getWidthFixedContainerWidthSumInSingleStaff(singleStaff: SingleStaff, measureHeight: number, filter: 'front' | 'rear' | 'all' = 'all', msSymbolContainer?: MsSymbolContainer): number {
    let widthSum = 0
    singleStaff.measureArray.forEach((measure: Measure) => {
        widthSum += getWidthFixedContainerWidthSumInMeasure(measure, measureHeight, filter, msSymbolContainer)
    })
    return widthSum
}

// 符尾比较特殊所以单独出一个方法
export function getNoteTailWidth(noteTail: NoteTail, noteHead: NoteHead, msSymbolContainer: MsSymbolContainer,
                                 measure: Measure,
                                 singleStaff: SingleStaff, musicScore: MusicScore,
                                 componentWidth: number) {
    const aspectRatio = getMsSymbolAspectRatio(noteTail)
    const height = getMsSymbolHeight(noteTail, musicScore)
    const beamGroup = getBeamGroup(noteHead.beamId, measure)
    if (beamGroup.length > 1) {
        // 如果是连音组首尾处的音符，符尾只有一半的宽度
        if (noteHead.id === beamGroup[0].note.id || noteHead.id === beamGroup[beamGroup.length - 1].note.id) {
            return getMsSymbolContainerWidth(msSymbolContainer, measure, singleStaff, musicScore, componentWidth) / 2
        }
        return getMsSymbolContainerWidth(msSymbolContainer, measure, singleStaff, musicScore, componentWidth)
    } else {
        return height * aspectRatio
    }
}

export function getMsSymbolWidth(msSymbol: MsSymbol, msSymbolContainer: MsSymbolContainer, measure: Measure, singleStaff: SingleStaff, musicScore: MusicScore, componentWidth: number) {
    const measureHeight = musicScore.measureHeight
    const aspectRatio = getMsSymbolAspectRatio(msSymbol)
    const heightMultiplier = getHeightMultiplier(msSymbol)
    const height = getMsSymbolHeight(msSymbol, musicScore)
    switch (msSymbol?.type) {
        case MsSymbolTypeEnum.NoteStem: {
            // noteStem的高度是动态的，所以宽度不能按照真实宽度乘以宽高比，而是乘以最小高度
            return measureHeight * heightMultiplier * aspectRatio
        }
        case MsSymbolTypeEnum.NoteTail: {
            const noteHead = getDataWithIndex(msSymbol.index, musicScore).msSymbol as NoteHead | null
            if (!noteHead) {
                console.error('音符头索引失败，符尾宽度计算失败')
                return height * aspectRatio
            }
            return getNoteTailWidth(msSymbol, noteHead, msSymbolContainer, measure, singleStaff, musicScore, componentWidth)
        }

        default: {
            return height * aspectRatio

        }
    }
}

export function getMsSymbolSlotWidth(msSymbol: MsSymbol, musicScore: MusicScore, isMain: boolean = false) {

    const mainMsSymbol = isMain ? msSymbol : getMainMsSymbol(msSymbol, musicScore)

    const aspectRatio = getMsSymbolAspectRatio(mainMsSymbol)
    const height = getMsSymbolHeight(mainMsSymbol, musicScore)
    return height * aspectRatio
}
