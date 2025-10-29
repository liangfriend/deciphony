import {
    MsSymbolTypeEnum,
    MusicScoreShowModeEnum
} from "deciphony-core";
import {MsSymbol, MusicScore, NoteDot, NoteHead, NoteStem} from "deciphony-core";
import {MsSymbolInformationMap} from "../constant";
import {getSlotTopToMeasure} from "./topUtil";
import {
    getBeamGroup,
    getDataWithIndex, staffRegionToIndex
} from "deciphony-core";
import {getHeightMultiplier} from "@/utils/geometryUtil";

export function getNoteStemHeight(noteStem: NoteStem, musicScore: MusicScore) {
    const noteHead = getDataWithIndex(noteStem.index, musicScore).msSymbol as NoteHead
    const information = MsSymbolInformationMap[noteStem?.type]
    const measureHeight = musicScore.measureHeight
    let minHeight = 0
    if ('heightMultiplier' in information) { // noteStem的最小高度
        const heightMultiplier = information.heightMultiplier as number
        minHeight = measureHeight * heightMultiplier
    }
    const NoteStemBottomToSlotTopUp = measureHeight * 1 / 8 // 符干距离slot顶部的距离
    const NoteStemBottomToSlotTopBottom = -measureHeight * 5 / 8  // 符干距离slot顶部的距离
    const measure = getDataWithIndex(noteHead.index, musicScore).measure
    if (!measure) {
        console.error("索引找不到measure,符杠height计算失败")
        return 0
    }
    const beamGroup = getBeamGroup(noteHead.beamId, measure)
    if (noteHead.beamId === -1 || !beamGroup || beamGroup.length === 0) {

        const slotTop = getSlotTopToMeasure(noteStem, musicScore)
        if (noteStem.direction === 'up') {
            return Math.max(minHeight, Math.abs(slotTop) - (measureHeight - minHeight) + NoteStemBottomToSlotTopUp)
        } else {
            return Math.max(minHeight, Math.abs(slotTop) + minHeight - NoteStemBottomToSlotTopUp)
        }
    } else { // 成组的情况
        const slotTop = getSlotTopToMeasure(noteStem, musicScore)

        if (noteStem.direction === 'up') {
            // 找到最靠上的音符头
            const farthestNoteHead = beamGroup.reduce((acc, cur) => {
                // 能进入noteStem筛选，肯定是线谱模式
                const accNoteHead = acc as NoteHead
                const curNoteHead = cur.note as NoteHead
                if (staffRegionToIndex(accNoteHead.region) < staffRegionToIndex(curNoteHead.region)) {
                    return cur.note
                }
                return acc
            }, beamGroup[0].note) as NoteHead
            // 得到最靠上音符所在slot距离小节的距离
            const farthestSlotTop = getSlotTopToMeasure(farthestNoteHead, musicScore)
            let height = 0
            //至少一个音符在向上方向超出了连接符尾距离底部的最小距离
            if (staffRegionToIndex(farthestNoteHead.region) > 0) {
                // height = slotBottom + measureHeight / 8 - measureHeight + minHeight
                // 如果超出的是当前音符

                if (farthestNoteHead === noteHead) {
                    return minHeight
                } else { // 如果超出的不是当前音符
                    return Math.abs(slotTop) - measureHeight + Math.abs(farthestSlotTop - measureHeight) + minHeight
                }
            } else { // 没有音符在向上方向超出了连接符尾距离底部的最小距离
                return Math.abs(slotTop) - measureHeight + NoteStemBottomToSlotTopUp + minHeight
            }

        } else {

            // 找到最靠下的音符头
            const farthestNoteHead = beamGroup.reduce((acc, cur) => {
                const accNoteHead = acc as NoteHead
                const curNoteHead = cur.note as NoteHead
                if (staffRegionToIndex(accNoteHead.region) > staffRegionToIndex(curNoteHead.region)) {
                    return curNoteHead
                }
                return acc
            }, beamGroup[0].note) as NoteHead

            const farthestSlotTop = getSlotTopToMeasure(farthestNoteHead, musicScore)
            let height = 0
            //至少一个超出
            if (staffRegionToIndex(farthestNoteHead.region) < 8) {
                // height = slotBottom + measureHeight / 8 - measureHeight + minHeight
                // 如果超出的是当前音符
                if (farthestNoteHead === noteHead) {
                    return minHeight
                } else { // 如果超出的不是当前音符
                    return Math.abs(slotTop) + farthestSlotTop + minHeight
                }
            } else { // 全部不超出
                return Math.abs(slotTop) - NoteStemBottomToSlotTopUp + minHeight
            }
        }
    }
}

export function getMsSymbolHeight(msSymbol: MsSymbol, musicScore: MusicScore): number {
    const information = MsSymbolInformationMap[msSymbol?.type]
    const measureHeight = musicScore.measureHeight
    const heightMultiplier = getHeightMultiplier(msSymbol)
    switch (msSymbol.type) {
        case MsSymbolTypeEnum.NoteStem: {
            return getNoteStemHeight(msSymbol, musicScore)
        }
        default: {
            return measureHeight * heightMultiplier
        }
    }
    return measureHeight
}
