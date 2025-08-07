import {
    MsSymbolTypeEnum,
    MusicScoreRegionEnum
} from "deciphony-core/musicScoreEnum";
import {MsSymbol, MusicScore, NoteHead} from "deciphony-core/types";
import {MsSymbolInformationMap} from "@/constant";
import {getSlotBottomToMeasure} from "@/utils/bottomUtil";
import {
    getBeamGroup,
    getDataWithIndex
} from "deciphony-core/utils/musicScoreDataUtil";

export function getMsSymbolHeight(msSymbol: MsSymbol, musicScore: MusicScore): number {
    const information = MsSymbolInformationMap[msSymbol?.type]
    const measureHeight = musicScore.measureHeight
    switch (msSymbol.type) {
        case MsSymbolTypeEnum.noteBar: {
            const noteHead = getDataWithIndex(msSymbol.index, musicScore).msSymbol as NoteHead

            let minHeight = 0
            if ('heightMultiplier' in information) { // noteBar的最小高度
                minHeight = measureHeight * information.heightMultiplier
            }
            const NoteBarBottomToSlotUp = measureHeight * 1 / 8
            const NoteBarBottomToSlotBottom = -measureHeight * 5 / 8
            const measure = getDataWithIndex(noteHead.index, musicScore).measure
            if (!measure) {
                console.error("索引找不到measure,符杠height计算失败")
                return 0
            }
            const beamGroup = getBeamGroup(noteHead.beamId, measure)
            if (noteHead.beamId === -1 || !beamGroup || beamGroup.length === 0) {

                const slotBottom = getSlotBottomToMeasure(msSymbol, musicScore)

                if (msSymbol.direction === 'up') {
                    return Math.max(minHeight, Math.abs(slotBottom) + minHeight - NoteBarBottomToSlotUp)
                } else {
                    return Math.max(minHeight, Math.abs(slotBottom) - measureHeight + minHeight + NoteBarBottomToSlotUp)
                }
            } else { // 成组的情况

                const slotBottom = getSlotBottomToMeasure(msSymbol, musicScore)

                if (msSymbol.direction === 'up') {
                    // 找到最靠上的音符头
                    const farthestNoteHead = beamGroup.reduce((acc, cur) => {
                        if (acc.region < cur.noteHead.region) {
                            return cur.noteHead
                        }
                        return acc
                    }, beamGroup[0].noteHead)
                    const farthestSlotBottom = getSlotBottomToMeasure(farthestNoteHead, musicScore)
                    let height = 0
                    //至少一个超出
                    if (farthestNoteHead.region > MusicScoreRegionEnum.line_1) {
                        height = slotBottom + measureHeight / 8 - measureHeight + minHeight
                        // 如果超出的是当前音符
                        if (farthestNoteHead === noteHead) {
                            return minHeight
                        } else { // 如果超出的不是当前音符
                            return -slotBottom + farthestSlotBottom + minHeight
                        }
                    } else { // 全部不超出
                        return -slotBottom - NoteBarBottomToSlotUp + minHeight
                    }

                } else {
                    // 找到最靠下的音符头
                    const farthestNoteHead = beamGroup.reduce((acc, cur) => {
                        if (acc.region > cur.noteHead.region) {
                            return cur.noteHead
                        }
                        return acc
                    }, beamGroup[0].noteHead)

                    const farthestSlotBottom = getSlotBottomToMeasure(farthestNoteHead, musicScore)
                    let height = 0
                    //至少一个超出
                    if (farthestNoteHead.region < MusicScoreRegionEnum.line_5) {
                        height = slotBottom + measureHeight / 8 - measureHeight + minHeight
                        // 如果超出的是当前音符
                        if (farthestNoteHead === noteHead) {
                            return minHeight
                        } else { // 如果超出的不是当前音符
                            return slotBottom - farthestSlotBottom + minHeight
                        }
                    } else { // 全部不超出
                        return slotBottom - measureHeight + NoteBarBottomToSlotUp + minHeight
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
