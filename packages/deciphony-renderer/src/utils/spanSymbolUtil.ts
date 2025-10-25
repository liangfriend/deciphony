import {MsTypeNameEnum, MusicScore, type Slur, Volta} from "../../../deciphony-core/src";
import {getMeasureLeftToMusicScore, getSlotLeftToMeasure} from "@/utils/leftUtil";
import {getMeasureWidth, getMsSymbolSlotWidth} from "@/utils/widthUtil";
import {
    getMeasureTopToMusicScore,
    getMinMsSymbolTopBetweenMsSymbolContainer,
    getMinMsSymbolTopInMeasure
} from "@/utils/topUtil";
import {getDataWithIndex, getTarget, traverseMeasure} from "deciphony-core";

export function voltaRect(volta: Volta, musicScore: MusicScore, voltaPosition, componentWidth: number, componentHeight: number) {

    const startMeasure = getTarget(volta.startTargetId, musicScore.map)
    const endMeasure = getTarget(volta.endTargetId, musicScore.map)
    if (!startMeasure || !endMeasure) return console.error('获取不到绑定元素', startMeasure, endMeasure)
    if (startMeasure.msTypeName !== MsTypeNameEnum.Measure || endMeasure.msTypeName !== MsTypeNameEnum.Measure) return console.error('volta绑定元素错误')
    // 反复符号绑定的两个小节必须在同一单谱表上
    if (startMeasure.index.multipleStavesIndex !== endMeasure.index.multipleStavesIndex) {
        console.error("反复符号绑定小节有误")
        return
    }
    voltaPosition.startPoint.x = getMeasureLeftToMusicScore(startMeasure, musicScore, componentWidth)
    voltaPosition.endPoint.x = voltaPosition.startPoint.x
    traverseMeasure(startMeasure.index, endMeasure.index, musicScore, (measure, singleStaff, multipleStaves) => {
        voltaPosition.endPoint.x += getMeasureWidth(measure, singleStaff, musicScore, componentWidth)
        const measureTop = getMeasureTopToMusicScore(measure, musicScore, componentHeight)
        const minTopMsSymbol = getMinMsSymbolTopInMeasure(measure, musicScore)
        const measureHeight = musicScore.measureHeight
        voltaPosition.startPoint.y = Math.min(measureTop, minTopMsSymbol + measureTop - measureHeight)
    })
    voltaPosition.endPoint.y = voltaPosition.startPoint.y + musicScore.measureHeight
}

export function slurRect(slur: Slur, musicScore: MusicScore, slurPosition, componentWidth: number, componentHeight: number) {

    const startNoteHead = getTarget(slur.startTargetId, musicScore.map)
    const endNoteHead = getTarget(slur.endTargetId, musicScore.map)
    if (!startNoteHead || !endNoteHead) return console.error('获取不到绑定元素', startNoteHead, endNoteHead)
    if (startNoteHead.msTypeName !== MsTypeNameEnum.MsSymbol || endNoteHead.msTypeName !== MsTypeNameEnum.MsSymbol) return console.error('volta绑定元素错误')
    // 反复符号绑定的两个小节必须在同一单谱表上
    if (startNoteHead.index.multipleStavesIndex !== endNoteHead.index.multipleStavesIndex) {
        console.error("反复符号绑定小节有误")
        return
    }
    const measureHeight = musicScore.measureHeight
    // start信息
    const startMsData = getDataWithIndex(startNoteHead.index, musicScore)
    const startMsSymbolContainer = startMsData.msSymbolContainer
    const startMeasure = startMsData.measure
    const startSingleStaff = startMsData.singleStaff
    // end信息
    const endMsData = getDataWithIndex(endNoteHead.index, musicScore)
    const endMsSymbolContainer = endMsData.msSymbolContainer
    const endMeasure = endMsData.measure
    const endSingleStaff = endMsData.singleStaff

    if (!startMsSymbolContainer || !startMeasure || !startSingleStaff) {
        console.error("索引数据出错，连音线rect计算失败")
        return
    }
    if (!endMsSymbolContainer || !endMeasure || !endSingleStaff) {
        console.error("索引数据出错，连音线rect计算失败")
        return
    }
    const startSlotWidth = getMsSymbolSlotWidth(startNoteHead, musicScore, true)
    const startMeasureWidth = getMeasureWidth(startMeasure, startSingleStaff, musicScore, componentWidth)
    const startNoteHeadLeftToMeasure = getSlotLeftToMeasure(startNoteHead, startMsSymbolContainer, startMeasure,
        startSingleStaff, musicScore, startSlotWidth, startMeasureWidth, componentWidth,)
    const startMeasureLeft = getMeasureLeftToMusicScore(startMeasure, musicScore, componentWidth)
    const startMeasureTop = getMeasureTopToMusicScore(startMeasure, musicScore, componentHeight)

    const startMinTopMsSymbol = getMinMsSymbolTopBetweenMsSymbolContainer(startMsSymbolContainer, endMsSymbolContainer, musicScore)


    const endSlotWidth = getMsSymbolSlotWidth(endNoteHead, musicScore, true)
    const endMeasureWidth = getMeasureWidth(endMeasure, endSingleStaff, musicScore, componentWidth)
    const endNoteHeadLeftToMeasure = getSlotLeftToMeasure(endNoteHead, endMsSymbolContainer, endMeasure,
        endSingleStaff, musicScore, endSlotWidth, endMeasureWidth, componentWidth,)
    const endMeasureLeft = getMeasureLeftToMusicScore(endMeasure, musicScore, componentWidth)

    // 坐标计算
    const startLeft = startMeasureLeft + startNoteHeadLeftToMeasure + startSlotWidth / 2
    const endLeft = endMeasureLeft + endNoteHeadLeftToMeasure + endSlotWidth / 2
    // 与符号的间距
    const space = 20
    slurPosition.startPoint.x = startLeft
    slurPosition.startPoint.y = startMinTopMsSymbol + startMeasureTop - space
    slurPosition.endPoint.x = endLeft
    slurPosition.endPoint.y = slurPosition.startPoint.y

    // 斜率常数
    const slope = 20 + space
    slurPosition.leftSlope.x = slurPosition.startPoint.x
    slurPosition.leftSlope.y = slurPosition.startPoint.y - slope
    slurPosition.rightSlope.x = slurPosition.endPoint.x
    slurPosition.rightSlope.y = slurPosition.endPoint.y - slope
}