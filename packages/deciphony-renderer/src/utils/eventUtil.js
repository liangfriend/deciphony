import { ChronaxieEnum, MsMode, MsSymbolTypeEnum, MsTypeNameEnum, ReserveMsSymbolType, StaffPositionTypeEnum, StaffRegionEnum } from "../../../deciphony-core/src/musicScoreEnum";
import { msSymbolContainerTemplate, msSymbolTemplate } from "deciphony-core";
import { getBeamGroup, getDataWithIndex, getSingleStaffRelatedSpanSymbolList, indexToStaffRegion, staffRegionToIndex, updateSpanSymbolView } from "deciphony-core";
import { addMsSymbol, addMsSymbolContainer, changeNoteStemDirection, changeNoteTailDirection, updateBeamGroupNote } from "deciphony-core";
// 添加发布者
export function select(value, currentSelected) {
    if (currentSelected.value) {
        currentSelected.value.options.highlight = false;
    }
    value.options.highlight = true;
    currentSelected.value = value;
}
export const eventConstant = {
    startX: 0, //鼠标按下时相对视口坐标
    startY: 0,
    originRegion: {
        region: StaffRegionEnum.Main,
        type: StaffPositionTypeEnum.Space,
        index: 1
    }, // 音符按下专用，记录初始region
};
// 处理选中元素mousemove事件
export function handleMouseMoveSelected(e, measureHeight, currentSelected, musicScore) {
    if (!currentSelected.value)
        return;
    switch (currentSelected.value.msTypeName) {
        case MsTypeNameEnum.MsSymbol: {
            const msSymbol = currentSelected.value;
            if (msSymbol.type === MsSymbolTypeEnum.NoteHead) {
                const dx = e.clientX - eventConstant.startX;
                const dy = e.clientY - eventConstant.startY;
                if (Math.abs(dy) > measureHeight / 8 && msSymbol) {
                    const index = Math.floor(dy / measureHeight * 8);
                    const targetIndex = staffRegionToIndex(eventConstant.originRegion) - index;
                    const originRegion = msSymbol.region;
                    msSymbol.region = indexToStaffRegion(targetIndex);
                    // 符杠更新
                    const noteStem = msSymbol.msSymbolArray.find((item) => item.type === MsSymbolTypeEnum.NoteStem);
                    const noteTail = msSymbol.msSymbolArray.find((item) => item.type === MsSymbolTypeEnum.NoteTail);
                    const measure = getDataWithIndex(msSymbol.index, musicScore).measure;
                    if (!measure) {
                        console.error("measure不存在，音符移动事件出错");
                        return;
                    }
                    const beamGroup = getBeamGroup(msSymbol.beamId, measure);
                    // 更新符杠和符尾方向
                    if ([ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter].includes(msSymbol.chronaxie)
                        || beamGroup.length < 2) { // 不成连音组
                        const currentRegionIndex = staffRegionToIndex(msSymbol.region);
                        if (noteStem && currentRegionIndex >= 4 && noteStem.direction !== 'down') {
                            changeNoteStemDirection('down', noteStem);
                        }
                        else if (noteStem && currentRegionIndex < 4 && noteStem.direction !== 'up') {
                            changeNoteStemDirection('up', noteStem);
                        }
                        if (noteTail && currentRegionIndex >= 4 && noteTail.direction !== 'down') {
                            changeNoteTailDirection('down', noteTail);
                        }
                        else if (noteTail && currentRegionIndex < 4 && noteTail.direction !== 'up') {
                            changeNoteTailDirection('up', noteTail);
                        }
                    }
                    else { // 成连音组
                        const measure = getDataWithIndex(msSymbol.index, musicScore).measure;
                        if (measure) {
                            updateBeamGroupNote(msSymbol.beamId, measure, musicScore);
                        }
                    }
                    // 跨小节符号位置更新
                    const singleStaff = getDataWithIndex(currentSelected.value.index, musicScore).singleStaff;
                    if (!singleStaff)
                        return console.error("找不到单谱表，跨小节符号更新失败");
                    const spanSymbolIdSet = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore);
                    updateSpanSymbolView(spanSymbolIdSet, musicScore);
                }
            }
            break;
        }
    }
}
export function handleMouseUpSelected(e, currentSelected, musicScore) {
    if (!currentSelected.value)
        return;
    switch (currentSelected.value.msTypeName) {
        case MsTypeNameEnum.MsSymbol: {
            currentSelected.value.options.highlight = false;
            currentSelected.value = null;
            break;
        }
        case MsTypeNameEnum.Measure: {
        }
    }
}
// 虚拟音符鼠标按下事件
export function virtualSymbolMouseDown(e, params) {
    if (!params.msState.currentSelected.value)
        return;
    if (params.msState.mode.value !== MsMode.edit || params.msState.currentSelected.value.msTypeName !== MsTypeNameEnum.Measure)
        return;
    const currentReservedType = params.msState.currentResevedType.value;
    if (currentReservedType === ReserveMsSymbolType.note) {
        let chronaxie = null;
        const reserveNote = params.msState.reserveMsSymbolMap.value.get(ReserveMsSymbolType.note);
        if (reserveNote && 'chronaxie' in reserveNote) {
            chronaxie = reserveNote.chronaxie;
        }
        const newNoteHead = msSymbolTemplate({
            type: MsSymbolTypeEnum.NoteHead,
            region: params.msSymbolInformation.region,
            chronaxie: chronaxie || ChronaxieEnum.quarter
        });
        const newMsSymbolContainer = msSymbolContainerTemplate({});
        // 给音符进行计算属性赋值及index赋值
        if (['front'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newNoteHead);
            if (params.msData.msSymbolContainer) {
                addMsSymbolContainer(newMsSymbolContainer, params.msData.msSymbolContainer, params.msData.musicScore, 'before');
            }
            else {
                addMsSymbolContainer(newMsSymbolContainer, params.msData.measure, params.msData.musicScore, 'before');
            }
        }
        else if (['end', 'middle'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newNoteHead);
            if (!params.msData.msSymbolContainer)
                return console.error("没有作为对照的符号容器，符号容器添加失败");
            addMsSymbolContainer(newMsSymbolContainer, params.msData.msSymbolContainer, params.msData.musicScore, 'after');
        }
        else if (['self'].includes(params.virtualSymbolContainerType)) {
            if (!params.msData.msSymbolContainer)
                return console.error("没有作为对照的符号容器，符号添加失败");
            const sameRegionNoteHead = params.msData.msSymbolContainer.msSymbolArray.find(m => {
                return m.type === MsSymbolTypeEnum.NoteHead && m.region === newNoteHead.region;
            });
            if (sameRegionNoteHead) {
                msSymbolMouseDown(e, params.msState.mode, params.msState.currentSelected, sameRegionNoteHead);
            }
            else {
                addMsSymbol(newNoteHead, params.msData.msSymbolContainer, params.msData.musicScore, 'after');
            }
        }
    }
    else if (currentReservedType === ReserveMsSymbolType.rest) {
        let chronaxie = null;
        const reserveRest = params.msState.reserveMsSymbolMap.value.get(ReserveMsSymbolType.rest);
        if (reserveRest && 'chronaxie' in reserveRest) {
            chronaxie = reserveRest.chronaxie;
        }
        const newRest = msSymbolTemplate({
            type: MsSymbolTypeEnum.Rest,
            chronaxie: chronaxie || ChronaxieEnum.quarter
        });
        const newMsSymbolContainer = msSymbolContainerTemplate({});
        // 给音符进行计算属性赋值及index赋值
        if (['front'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newRest);
            if (params.msData.msSymbolContainer) {
                addMsSymbolContainer(newMsSymbolContainer, params.msData.msSymbolContainer, params.msData.musicScore, 'before');
            }
            else {
                addMsSymbolContainer(newMsSymbolContainer, params.msData.measure, params.msData.musicScore, 'before');
            }
        }
        else if (['end', 'middle'].includes(params.virtualSymbolContainerType)) {
            newMsSymbolContainer.msSymbolArray.push(newRest);
            if (!params.msData.msSymbolContainer)
                return console.error("没有作为对照的符号容器，符号容器添加失败");
            addMsSymbolContainer(newMsSymbolContainer, params.msData.msSymbolContainer, params.msData.musicScore, 'after');
        }
        else if (['self'].includes(params.virtualSymbolContainerType)) {
            if (!params.msData.msSymbolContainer)
                return console.error("没有作为对照的符号容器，符号添加失败");
            const sameRegionNoteHead = params.msData.msSymbolContainer.msSymbolArray.find(m => {
                return m.type === MsSymbolTypeEnum.Rest;
            });
            if (sameRegionNoteHead) {
                msSymbolMouseDown(e, params.msState.mode, params.msState.currentSelected, sameRegionNoteHead);
            }
            else {
                addMsSymbol(newRest, params.msData.msSymbolContainer, params.msData.musicScore, 'after');
            }
        }
    }
}
export function spanSymbolMouseDown(e, mode, currentSelected, spanSymbol) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(spanSymbol, currentSelected);
    }
}
export function spanSymbolMouseUp(e, mode, currentSelected, spanSymbol) {
}
export function msSymbolMouseDown(e, mode, currentSelected, msSymbol) {
    if (msSymbol.type === MsSymbolTypeEnum.NoteHead) { // 赋值region
        eventConstant.originRegion = msSymbol.region;
    }
    if (mode.value === MsMode.edit) {
        // 订阅
        select(msSymbol, currentSelected);
    }
}
export function msSymbolMouseUp(e, mode, currentSelected, msSymbol) {
}
export function measureMouseDown(e, mode, currentSelected, measure) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(measure, currentSelected);
    }
}
export function singleStaffMouseDown(e, mode, currentSelected, singleStaff) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(singleStaff, currentSelected);
    }
}
export function multipleStavesMouseDown(e, mode, currentSelected, multipleStaves) {
    if (mode.value === MsMode.edit) {
        // 订阅
        select(multipleStaves, currentSelected);
    }
}
