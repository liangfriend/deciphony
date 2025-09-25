import {
    MsSymbolTypeEnum,
    MusicScoreShowModeEnum
} from "../../../deciphony-core/src/musicScoreEnum";
import {MsSymbol, MusicScore, NoteHead} from "../../../deciphony-core/src/types";
import {MsSymbolInformationMap} from "../constant";
import {getSlotBottomToMeasure} from "../utils/bottomUtil";
import {
    getBeamGroup,
    getDataWithIndex, staffRegionToIndex
} from "deciphony-core";

export function getMsSymbolHeight(msSymbol: MsSymbol, musicScore: MusicScore): number {
    const information = MsSymbolInformationMap[msSymbol?.type]
    const measureHeight = musicScore.measureHeight
    switch (msSymbol.type) {
        case MsSymbolTypeEnum.NoteStem: {
            const noteHead = getDataWithIndex(msSymbol.index, musicScore).msSymbol as NoteHead

            let minHeight = 0
            if ('heightMultiplier' in information) { // noteStem的最小高度
                minHeight = measureHeight * information.heightMultiplier
            }
            const NoteStemBottomToSlotUp = measureHeight * 1 / 8
            const NoteStemBottomToSlotBottom = -measureHeight * 5 / 8
            const measure = getDataWithIndex(noteHead.index, musicScore).measure
            if (!measure) {
                console.error("索引找不到measure,符杠height计算失败")
                return 0
            }
            const beamGroup = getBeamGroup(noteHead.beamId, measure)
            if (noteHead.beamId === -1 || !beamGroup || beamGroup.length === 0) {

                const slotBottom = getSlotBottomToMeasure(msSymbol, musicScore)

                if (msSymbol.direction === 'up') {
                    return Math.max(minHeight, Math.abs(slotBottom) + minHeight - NoteStemBottomToSlotUp)
                } else {
                    return Math.max(minHeight, Math.abs(slotBottom) - measureHeight + minHeight + NoteStemBottomToSlotUp)
                }
            } else { // 成组的情况

                const slotBottom = getSlotBottomToMeasure(msSymbol, musicScore)

                if (msSymbol.direction === 'up') {
                    // 找到最靠上的音符头
                    const farthestNoteHead = beamGroup.reduce((acc, cur) => {
                        // 能进入noteStem筛选，肯定是线谱模式
                        const accNoteHead = acc as NoteHead
                        const curNoteHead = cur.note as NoteHead
                        if (accNoteHead.region < curNoteHead.region) {
                            return cur.note
                        }
                        return acc
                    }, beamGroup[0].note) as NoteHead
                    const farthestSlotBottom = getSlotBottomToMeasure(farthestNoteHead, musicScore)
                    let height = 0
                    //至少一个超出
                    if (staffRegionToIndex(farthestNoteHead.region) > 0) {
                        height = slotBottom + measureHeight / 8 - measureHeight + minHeight
                        // 如果超出的是当前音符
                        if (farthestNoteHead === noteHead) {
                            return minHeight
                        } else { // 如果超出的不是当前音符
                            return -slotBottom + farthestSlotBottom + minHeight
                        }
                    } else { // 全部不超出
                        return -slotBottom - NoteStemBottomToSlotUp + minHeight
                    }

                } else {

                    // 找到最靠下的音符头
                    const farthestNoteHead = beamGroup.reduce((acc, cur) => {
                        const accNoteHead = acc as NoteHead
                        const curNoteHead = cur.note as NoteHead
                        if (accNoteHead.region > curNoteHead.region) {
                            return curNoteHead
                        }
                        return acc
                    }, beamGroup[0].note) as NoteHead

                    const farthestSlotBottom = getSlotBottomToMeasure(farthestNoteHead, musicScore)
                    let height = 0
                    //至少一个超出
                    if (staffRegionToIndex(farthestNoteHead.region) < 8) {
                        height = slotBottom + measureHeight / 8 - measureHeight + minHeight
                        // 如果超出的是当前音符
                        if (farthestNoteHead === noteHead) {
                            return minHeight
                        } else { // 如果超出的不是当前音符
                            return slotBottom - farthestSlotBottom + minHeight
                        }
                    } else { // 全部不超出
                        return slotBottom - measureHeight + NoteStemBottomToSlotUp + minHeight
                    }
                }
            }

            break
        }
        default: {
            if ('heightMultiplier' in information) {
                return measureHeight * information.heightMultiplier
            }
        }
    }
    return measureHeight
}
