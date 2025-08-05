import {
    ChronaxieEnum,
    MsMode,
    MsSymbolTypeEnum,
    MsTypeNameEnum,
    MusicScoreRegionEnum,
    ReserveMsSymbolType
} from "deciphony-core/musicScoreEnum";
import {
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MsType,
    MultipleStaves,
    MusicScore,
    NoteBar, NoteHead,
    NoteTail, Rest,
    SingleStaff,
    SpanSymbol,
    VirtualSymbolContainerType
} from "deciphony-core/types";

import {Ref} from 'vue';
import {
    msSymbolContainerTemplate,
    msSymbolTemplate
} from "deciphony-core/utils/objectTemplateUtil";
import {
    getBeamGroup,
    getDataWithIndex,
    getSingleStaffRelatedSpanSymbolList,
    updateSpanSymbolView
} from "deciphony-core/utils/musicScoreDataUtil";
import {
    addMsSymbol,
    addMsSymbolContainer,
    changeNoteBarDirection,
    changeNoteTailDirection,
    updateBeamGroupNote
} from "deciphony-core/utils/changeStructureUtil";
import {MsState} from "../types";


// 添加发布者
export function select(value: MsType, currentSelected: Ref<null | MsType>) {
    if (currentSelected.value) {
        currentSelected.value.options.highlight = false
    }
    value.options.highlight = true
    currentSelected.value = value

}


export const eventConstant: { startX: number, startY: number, originRegion: MusicScoreRegionEnum } = {
    startX: 0, //鼠标按下时相对视口坐标
    startY: 0,
    originRegion: MusicScoreRegionEnum.space_1, // 音符按下专用，记录初始region
}

// 处理选中元素mousemove事件
export function handleMouseMoveSelected(e: MouseEvent, measureHeight: number, currentSelected: Ref<MsType | null>, musicScore: MusicScore) {

    if (!currentSelected.value) return
    switch (currentSelected.value.msTypeName) {
        case MsTypeNameEnum.MsSymbol: {
            const msSymbol = currentSelected.value
            if (msSymbol.type === MsSymbolTypeEnum.noteHead) {
                const dx = e.clientX - eventConstant.startX;
                const dy = e.clientY - eventConstant.startY;
                if (Math.abs(dy) > measureHeight / 8 && msSymbol) {
                    const index = Math.floor(dy / measureHeight * 8);
                    const targetIndex = eventConstant.originRegion - index;
                    if (targetIndex in MusicScoreRegionEnum) {
                        const originRegion = msSymbol.region
                        msSymbol.region = targetIndex as MusicScoreRegionEnum;
                        // 符杠更新
                        const noteBar = msSymbol.msSymbolArray.find((item:MsSymbol) => item.type === MsSymbolTypeEnum.noteBar) as NoteBar | null;
                        const noteTail = msSymbol.msSymbolArray.find((item:MsSymbol) => item.type === MsSymbolTypeEnum.noteTail) as NoteTail | null;
                        const measure = getDataWithIndex(msSymbol.index, musicScore).measure
                        if (!measure) {
                            console.error("measure不存在，音符移动事件出错")
                            return
                        }
                        const beamGroup = getBeamGroup(msSymbol.beamId, measure)
                        // 更新符杠和符尾方向
                        if ([ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter].includes(msSymbol.chronaxie)
                            || beamGroup.length < 2) { // 不成连音组
                            if (noteBar && msSymbol.region >= MusicScoreRegionEnum.line_3 && noteBar.direction !== 'down') {
                                changeNoteBarDirection('down', noteBar)
                            } else if (noteBar && msSymbol.region < MusicScoreRegionEnum.line_3 && noteBar.direction !== 'up') {
                                changeNoteBarDirection('up', noteBar)
                            }
                            if (noteTail && msSymbol.region >= MusicScoreRegionEnum.line_3 && noteTail.direction !== 'down') {
                                changeNoteTailDirection('down', noteTail)
                            } else if (noteTail && msSymbol.region < MusicScoreRegionEnum.line_3 && noteTail.direction !== 'up') {
                                changeNoteTailDirection('up', noteTail)
                            }
                        } else { // 成连音组
                            const measure = getDataWithIndex(msSymbol.index, musicScore).measure
                            if (measure) {
                                updateBeamGroupNote(msSymbol.beamId, measure, musicScore)
                            }
                        }

                        // 跨小节符号位置更新
                        const singleStaff = getDataWithIndex(currentSelected.value.index, musicScore).singleStaff
                        if (!singleStaff) return console.error("找不到单谱表，跨小节符号更新失败")
                        const spanSymbolIdSet = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
                        updateSpanSymbolView(spanSymbolIdSet, musicScore)
                    }
                }
            }
            break
        }
    }
}


export function handleMouseUpSelected(e: MouseEvent, currentSelected: Ref<MsType | null>, musicScore: MusicScore) {
    if (!currentSelected.value) return
    switch (currentSelected.value.msTypeName) {
        case MsTypeNameEnum.MsSymbol: {


            currentSelected.value.options.highlight = false
            currentSelected.value = null

            break
        }
        case MsTypeNameEnum.Measure: {
        }
    }
}

// 虚拟音符鼠标按下事件
export function virtualSymbolMouseDown(
    e: MouseEvent, params: {
        msState: MsState,
        virtualSymbolContainerType: VirtualSymbolContainerType,
        msData: {
            musicScore: MusicScore,
            msSymbolContainer: MsSymbolContainer | null,
            measure: Measure,
            singleStaff: SingleStaff,
            multipleStaves: MultipleStaves,
        },
        msSymbolInformation: {
            region: MusicScoreRegionEnum
        }
    },) {
    if (!params.msState.currentSelected.value) return
    if (params.msState.mode.value !== MsMode.edit || params.msState.currentSelected.value.msTypeName !== MsTypeNameEnum.Measure) return
    const currentReservedType = params.msState.currentResevedType.value

    if (currentReservedType === ReserveMsSymbolType.note) {
        let chronaxie = null
        const reserveNote = params.msState.reserveMsSymbolMap.value.get(ReserveMsSymbolType.note)
        if (reserveNote && 'chronaxie' in reserveNote) {
            chronaxie = reserveNote.chronaxie
        }
        const newNoteHead: NoteHead = msSymbolTemplate({
            type: MsSymbolTypeEnum.noteHead,
            region: params.msSymbolInformation.region,
            chronaxie: chronaxie || ChronaxieEnum.quarter
        }) as NoteHead
        const newMsSymbolContainer = msSymbolContainerTemplate({})
        // 给音符进行计算属性赋值及index赋值

        if (['front'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newNoteHead)
            if (params.msData.msSymbolContainer) {
                addMsSymbolContainer(newMsSymbolContainer,
                    params.msData.msSymbolContainer, params.msData.musicScore, 'before')
            } else {
                addMsSymbolContainer(newMsSymbolContainer,
                    params.msData.measure, params.msData.musicScore, 'before')
            }

        } else if (['end', 'middle'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newNoteHead)
            if (!params.msData.msSymbolContainer) return console.error("没有作为对照的符号容器，符号容器添加失败")
            addMsSymbolContainer(newMsSymbolContainer,
                params.msData.msSymbolContainer, params.msData.musicScore, 'after')
        } else if (['self'].includes(params.virtualSymbolContainerType)) {
            if (!params.msData.msSymbolContainer) return console.error("没有作为对照的符号容器，符号添加失败")

            const sameRegionNoteHead = params.msData.msSymbolContainer.msSymbolArray.find(m => {
                return m.type === MsSymbolTypeEnum.noteHead && m.region === newNoteHead.region
            })
            if (sameRegionNoteHead) {
                msSymbolMouseDown(e, params.msState.mode, params.msState.currentSelected, sameRegionNoteHead)
            } else {
                addMsSymbol(newNoteHead,
                    params.msData.msSymbolContainer, params.msData.musicScore, 'after')
            }
        }
    } else if (currentReservedType === ReserveMsSymbolType.rest) {


        let chronaxie = null
        const reserveRest = params.msState.reserveMsSymbolMap.value.get(ReserveMsSymbolType.rest)
        if (reserveRest && 'chronaxie' in reserveRest) {
            chronaxie = reserveRest.chronaxie
        }
        const newRest: Rest = msSymbolTemplate({
            type: MsSymbolTypeEnum.rest,
            chronaxie: chronaxie || ChronaxieEnum.quarter
        }) as Rest


        const newMsSymbolContainer = msSymbolContainerTemplate({})
        // 给音符进行计算属性赋值及index赋值

        if (['front'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newRest)
            if (params.msData.msSymbolContainer) {
                addMsSymbolContainer(newMsSymbolContainer,
                    params.msData.msSymbolContainer, params.msData.musicScore, 'before')
            } else {
                addMsSymbolContainer(newMsSymbolContainer,
                    params.msData.measure, params.msData.musicScore, 'before')
            }

        } else if (['end', 'middle'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newRest)
            if (!params.msData.msSymbolContainer) return console.error("没有作为对照的符号容器，符号容器添加失败")
            addMsSymbolContainer(newMsSymbolContainer,
                params.msData.msSymbolContainer, params.msData.musicScore, 'after')
        } else if (['self'].includes(params.virtualSymbolContainerType)) {
            if (!params.msData.msSymbolContainer) return console.error("没有作为对照的符号容器，符号添加失败")
            const sameRegionNoteHead = params.msData.msSymbolContainer.msSymbolArray.find(m => {
                return m.type === MsSymbolTypeEnum.rest
            })
            if (sameRegionNoteHead) {
                msSymbolMouseDown(e, params.msState.mode, params.msState.currentSelected, sameRegionNoteHead)
            } else {
                addMsSymbol(newRest,
                    params.msData.msSymbolContainer, params.msData.musicScore, 'after')
            }
        }
    }

}

export function spanSymbolMouseDown(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, spanSymbol: SpanSymbol) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(spanSymbol, currentSelected)
    }
}

export function spanSymbolMouseUp(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, spanSymbol: SpanSymbol) {

}

export function msSymbolMouseDown(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, msSymbol: MsSymbol) {
    if (msSymbol.type === MsSymbolTypeEnum.noteHead) {  // 赋值region
        eventConstant.originRegion = msSymbol.region
    }
    if (mode.value === MsMode.edit) {
        // 订阅
        select(msSymbol, currentSelected)
    }
}

export function msSymbolMouseUp(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, msSymbol: MsSymbol) {

}

export function measureMouseDown(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, measure: Measure) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(measure, currentSelected)
    }
}

export function singleStaffMouseDown(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, singleStaff: SingleStaff) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(singleStaff, currentSelected)
    }
}

export function multipleStavesMouseDown(e: MouseEvent, mode: Ref<MsMode>, currentSelected: Ref<MsType | null>, multipleStaves: MultipleStaves) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(multipleStaves, currentSelected)
    }
}
