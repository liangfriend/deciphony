import {
    AccidentalEnum,
    BarLineTypeEnum,
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum, MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum,
    MsTypeNameEnum,
    SpanSymbolTypeEnum, StaffPositionTypeEnum, StaffRegionEnum
} from "../musicScoreEnum";

import {
    AccidentalMsSymbol,
    BarLine,
    ClefMsSymbol,
    KeySignatureMsSymbol,
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MsType,
    MultipleStaves,
    MusicScore,
    NoteStem, NoteHead,
    NoteTail,
    SingleStaff, Slur,
    SpanSymbol, StaffRegion,
    TimeSignature,
    TimeSignatureMsSymbol, Volta
} from "../types";
import {
    msSymbolContainerTemplate,
    msSymbolTemplate
} from "./objectTemplateUtil";
import {
    getDataWithIndex,
    getMultipleStavesRelatedSpanSymbolList,
    getMusicScoreRelatedSpanSymbolList,
    getSingleStaffRelatedSpanSymbolList,
    setChildMsSymbolArrayIndex,
    setMeasureArrayIndex,
    setMsSymbolArrayIndex,
    setMsSymbolContainerArrayIndex,
    setMultipleStavesIndex,
    setSingleStaffArrayIndex, staffRegionToIndex,
    updateSpanSymbolView
} from "./musicScoreDataUtil";


export function musicScoreMapAdd(msData: MsType, musicScore: MusicScore) {
    musicScore.map[msData.id] = msData
}

export function musicScoreMapRemove(id: number, musicScore: MusicScore) {
    if (musicScore.map[id]) {
        delete musicScore.map[id]
    }
}

// 添加子符号
export function addChildMsSymbol(childMsSymbol: MsSymbol, msSymbol: MsSymbol, musicScore: MusicScore) {
    msSymbol.msSymbolArray.push(childMsSymbol);
    setChildMsSymbolArrayIndex(msSymbol)
    musicScoreMapAdd(childMsSymbol, musicScore)
}

// 移除子符号
export function removeChildMsSymbol(childMsSymbol: MsSymbol, msSymbol: MsSymbol, musicScore: MusicScore) {
    const index = msSymbol.msSymbolArray.indexOf(childMsSymbol)
    if (index === -1) return console.error('符号内找不到目标跟随符号，跟随符号删除失败')
    msSymbol.msSymbolArray.splice(index, 1)
    //
    musicScoreMapRemove(childMsSymbol.id, musicScore)
}

//
export function addVolta(volta: Volta, startMeasure: Measure, endMeasure: Measure, musicScore: MusicScore) {
    addBindingStartId(startMeasure, volta.id)
    addBindingEndId(endMeasure, volta.id)
    musicScore.spanSymbolArray.push(volta);
    musicScoreMapAdd(volta, musicScore)
}

export function addSlur(slur: Slur, startNoteHead: NoteHead, endNoteHead: NoteHead, musicScore: MusicScore) {
    addBindingStartId(startNoteHead, slur.id)
    addBindingEndId(endNoteHead, slur.id)
    musicScore.spanSymbolArray.push(slur);
    musicScoreMapAdd(slur, musicScore)
}

// 添加跨小节符号
export function addSpanSymbol(newSpanSymbol: SpanSymbol, startMsData: Exclude<MsType, SpanSymbol>, endMsData: Exclude<MsType, SpanSymbol>, musicScore: MusicScore) {
    switch (newSpanSymbol.type) {
        case SpanSymbolTypeEnum.volta: {
            if (startMsData.msTypeName === MsTypeNameEnum.Measure && endMsData.msTypeName === MsTypeNameEnum.Measure) {
                addVolta(newSpanSymbol, startMsData, endMsData, musicScore)
            } else {
                console.error("添加跨小节符号volta出错")
            }
            break
        }
        case SpanSymbolTypeEnum.slur: {
            if (startMsData.msTypeName === MsTypeNameEnum.MsSymbol && endMsData.msTypeName === MsTypeNameEnum.MsSymbol
                && startMsData.type === MsSymbolTypeEnum.NoteHead && endMsData.type === MsSymbolTypeEnum.NoteHead) {
                addSlur(newSpanSymbol, startMsData, endMsData, musicScore)
            } else {
                console.error("添加跨小节符号slur出错")
            }
            break
        }
    }

}


// 添加符号
export function addMsSymbol(newMsSymbol: MsSymbol, currSelected: MsSymbol | MsSymbolContainer, musicScore: MusicScore, position: 'after' | 'before' | number = 'after') {
    if (currSelected.msTypeName === MsTypeNameEnum.MsSymbol) {
        if (typeof position === 'number') {
            console.error('以符号为定位元素添加符号时，position只可以传after或before')
            return
        }
        const msSymbolContainer = getDataWithIndex(currSelected.index, musicScore).msSymbolContainer
        const msSymbol = getDataWithIndex(currSelected.index, musicScore).msSymbol
        if (!msSymbolContainer) return console.error("符号容器不存在，符号添加失败")
        if (!msSymbol) return console.error("符号不存在，符号添加失败")
        const array = msSymbolContainer.msSymbolArray;
        const targetIndex = array.findIndex(item => item === msSymbol);
        if (position === 'before') {
            array.splice(targetIndex, 0, newMsSymbol);
        } else {
            array.splice(targetIndex + 1, 0, newMsSymbol);
        }
        // 计算index
        setMsSymbolArrayIndex(msSymbolContainer)
    } else if (currSelected.msTypeName === MsTypeNameEnum.MsSymbolContainer) {

        const msSymbolContainer = currSelected
        if (!msSymbolContainer) return console.error("小节不存在，符号容器添加失败")
        const array = msSymbolContainer.msSymbolArray;
        if (position === -1 || typeof position === 'string') {
            array.push(newMsSymbol)
        } else if (position >= 0 && position <= array.length) {
            array.splice(position, 0, newMsSymbol)
        } else {
            console.error('索引有误，符号添加失败')
            return
        }
        // 计算index
        setMsSymbolArrayIndex(msSymbolContainer)
    }
    musicScoreMapAdd(newMsSymbol, musicScore)
    if (!('index' in currSelected)) return console.error("当前选中对象缺少index,符号添加失败")
    const singleStaff = getDataWithIndex(currSelected.index, musicScore).singleStaff
    if (!singleStaff) return console.error("单谱表查找出错，符号添加失败")
    // 索引生成
    setMeasureArrayIndex(singleStaff)
    // 跨小节符号位置更新
    const spanSymbolIdSet = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolIdSet, musicScore)
}

// 移除符号
export function removeMsSymbol(
    msSymbol: MsSymbol,
    musicScore: MusicScore,
) {
    const msSymbolContainer = getDataWithIndex(msSymbol.index, musicScore).msSymbolContainer
    if (!msSymbolContainer) return console.error("符号容器不存在，符号移除失败")
    const array = msSymbolContainer.msSymbolArray;
    const index = array.findIndex(item => item === msSymbol);


    if (index === -1) return console.error("找不到目标符号")
    array.splice(index, 1);
    // 计算index
    setMsSymbolArrayIndex(msSymbolContainer)
    musicScoreMapRemove(msSymbolContainer.id, musicScore)

}

// 添加符号容器
export function addMsSymbolContainer(newMsSymbolContainer: MsSymbolContainer, currSelected: MsSymbolContainer | Measure, musicScore: MusicScore, position: 'after' | 'before' | number = 'after') {

    if (currSelected.msTypeName === MsTypeNameEnum.MsSymbolContainer) {
        if (typeof position === 'number') {
            console.error('以符号容器为定位元素添加符号容器时，position只可以传after或before')
            return
        }
        const measure = getDataWithIndex(currSelected.index, musicScore).measure
        const msSymbolContainer = getDataWithIndex(currSelected.index, musicScore).msSymbolContainer
        if (!measure) return console.error("小节不存在，符号容器添加失败")
        if (!msSymbolContainer) return console.error("符号容器不存在，符号容器添加失败")
        const array = measure.msSymbolContainerArray;
        const targetIndex = array.findIndex(item => item === msSymbolContainer);
        if (position === 'before') {
            array.splice(targetIndex, 0, newMsSymbolContainer);
        } else {
            array.splice(targetIndex + 1, 0, newMsSymbolContainer);
        }
        // 计算index
        setMsSymbolContainerArrayIndex(measure)
    } else if (currSelected.msTypeName === MsTypeNameEnum.Measure) {
        const measure = currSelected
        if (!measure) return console.error("小节不存在，符号容器添加失败")
        const array = measure.msSymbolContainerArray;
        if (position === -1 || typeof position === 'string') {
            array.push(newMsSymbolContainer)
        } else if (position >= 0 && position <= array.length) {
            array.splice(position, 0, newMsSymbolContainer)
        } else {
            console.error('索引有误，符号容器添加失败')
            return
        }

        // 计算index
        setMsSymbolContainerArrayIndex(measure)
    }
    musicScoreMapAdd(newMsSymbolContainer, musicScore)
}

// 移除符号容器
export function removeMsSymbolContainer(
    msSymbolContainer: MsSymbolContainer,
    musicScore: MusicScore,
) {
    const msData = getDataWithIndex(msSymbolContainer.index, musicScore)
    const measure = msData.measure
    const singleStaff = msData.singleStaff
    if (!measure || !singleStaff) return console.error("索引数据出错，符号容器移除失败")
    const array = measure.msSymbolContainerArray;
    const index = array.findIndex(item => item === msSymbolContainer);

    if (index === -1) return console.error("找不到目标符号容器")
    array.splice(index, 1);
    musicScoreMapRemove(msSymbolContainer.id, musicScore)
    // 计算index
    setMsSymbolContainerArrayIndex(measure)
    // 移除符号容器相关联跨小节符号
    removeMsSymbolContainerRelatedSpanSymbol(msSymbolContainer, musicScore)
    // // 更新跨小节符号视图
    const spanSymbolIdSet = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolIdSet, musicScore)


}

// 添加小节
export function addMeasure(newMeasure: Measure, currSelected: Measure | SingleStaff, musicScore: MusicScore, position: 'after' | 'before' | number = 'after') {

    if (currSelected.msTypeName === MsTypeNameEnum.Measure) {
        if (typeof position === 'number') {
            console.error('以小节为定位元素添加小节时，position只可以传after或before')
            return
        }
        const singleStaff = getDataWithIndex(currSelected.index, musicScore).singleStaff
        if (!singleStaff) return console.error("单谱表不存在，小节插入失败");
        const array = singleStaff.measureArray;
        const targetIndex = array.findIndex(item => item === currSelected);
        if (position === 'before') {
            array.splice(targetIndex, 0, newMeasure);
        } else {
            array.splice(targetIndex + 1, 0, newMeasure);
        }
        // 计算index
        setMeasureArrayIndex(singleStaff)
        // 更新跨小节符号
        const spanSymbolSet = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
        updateSpanSymbolView(spanSymbolSet, musicScore)
    } else if (currSelected.msTypeName === MsTypeNameEnum.SingleStaff) {
        const array = currSelected.measureArray
        if (position === -1 || typeof position === 'string') {
            array.push(newMeasure)
        } else if (position >= 0 && position <= array.length) {
            array.splice(position, 0, newMeasure)
        } else {
            console.error('索引有误，小节添加失败')
            return
        }
        // 计算index
        setMeasureArrayIndex(currSelected)
        // 更新跨小节符号
        const spanSymbolSet = getSingleStaffRelatedSpanSymbolList(currSelected, musicScore)
        updateSpanSymbolView(spanSymbolSet, musicScore)
    }
    musicScoreMapAdd(newMeasure, musicScore)
}

// 删除小节
export function removeMeasure(
    measure: Measure,
    musicScore: MusicScore,
) {

    const singleStaff = getDataWithIndex(measure.index, musicScore).singleStaff
    if (!singleStaff) return console.error("单谱表不存在，小节移除失败")
    // 如果是单谱表内最后的小节，则不可以删除
    if (singleStaff && singleStaff.measureArray.length <= 1) return console.error("弹幕表内至少保留一个小节")
    const array = singleStaff.measureArray;
    const index = array.findIndex(item => item === measure);
    if (index === -1) return console.error("找不到目标小节")
    array.splice(index, 1);
    // 更新map
    musicScoreMapRemove(measure.id, musicScore)

    // 计算index
    setMeasureArrayIndex(singleStaff)
    // 更新跨小节符号视图
    const spanSymbolSet = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolSet, musicScore)
    // 移除小节相关联跨小节符号
    removeMeasureRelatedSpanSymbol(measure, musicScore)


}

// 删除符号相关联的跨小节符号
export function removeMsSymbolRelatedSpanSymbol(msSymbol: MsSymbol, musicScore: MusicScore) {
    for (let i = musicScore.spanSymbolArray.length - 1; i >= 0; i--) {
        const spanSymbol = musicScore.spanSymbolArray[i];
        if (
            msSymbol.bindingStartId.includes(spanSymbol.id) ||
            msSymbol.bindingEndId.includes(spanSymbol.id)
        ) {
            removeSpanSymbol(spanSymbol, musicScore)
            musicScoreMapRemove(spanSymbol.id, musicScore);
        }
    }
}

// 删除符号容器相关联的跨小节符号
export function removeMsSymbolContainerRelatedSpanSymbol(msSymbolContainer: MsSymbolContainer, musicScore: MusicScore) {
    msSymbolContainer.msSymbolArray.forEach((msSymbol) => {
        removeMsSymbolRelatedSpanSymbol(msSymbol, musicScore)
    })
    for (let i = musicScore.spanSymbolArray.length - 1; i >= 0; i--) {
        const spanSymbol = musicScore.spanSymbolArray[i];
        if (
            msSymbolContainer.bindingStartId.includes(spanSymbol.id) ||
            msSymbolContainer.bindingEndId.includes(spanSymbol.id)
        ) {
            removeSpanSymbol(spanSymbol, musicScore)
            musicScoreMapRemove(spanSymbol.id, musicScore);
        }
    }
}

// 删除小节相关联的跨小节符号
export function removeMeasureRelatedSpanSymbol(measure: Measure, musicScore: MusicScore) {
    measure.msSymbolContainerArray.forEach((msSymbolContainer) => {
        removeMsSymbolContainerRelatedSpanSymbol(msSymbolContainer, musicScore)
    })
    for (let i = musicScore.spanSymbolArray.length - 1; i >= 0; i--) {
        const spanSymbol = musicScore.spanSymbolArray[i];
        if (
            measure.bindingStartId.includes(spanSymbol.id) ||
            measure.bindingEndId.includes(spanSymbol.id)
        ) {
            removeSpanSymbol(spanSymbol, musicScore)
            musicScoreMapRemove(spanSymbol.id, musicScore);
        }
    }
}

// 删除单谱表相关联的跨小节符号
export function removeSingleStaffRelatedSpanSymbol(singleStaff: SingleStaff, musicScore: MusicScore) {
    singleStaff.measureArray.forEach((measure) => {
        removeMeasureRelatedSpanSymbol(measure, musicScore)
    })
    for (let i = musicScore.spanSymbolArray.length - 1; i >= 0; i--) {
        const spanSymbol = musicScore.spanSymbolArray[i];
        if (
            singleStaff.bindingStartId.includes(spanSymbol.id) ||
            singleStaff.bindingEndId.includes(spanSymbol.id)
        ) {
            removeSpanSymbol(spanSymbol, musicScore)
            musicScoreMapRemove(spanSymbol.id, musicScore);
        }
    }
}

// 删除复谱表相关联的跨小节符号
export function removeMultipleStavesRelatedSpanSymbol(multipleStaves: MultipleStaves, musicScore: MusicScore) {
    multipleStaves.singleStaffArray.forEach((singleStaff) => {
        removeSingleStaffRelatedSpanSymbol(singleStaff, musicScore)
    })
    for (let i = musicScore.spanSymbolArray.length - 1; i >= 0; i--) {
        const spanSymbol = musicScore.spanSymbolArray[i];
        if (
            multipleStaves.bindingStartId.includes(spanSymbol.id) ||
            multipleStaves.bindingEndId.includes(spanSymbol.id)
        ) {
            removeSpanSymbol(spanSymbol, musicScore)
            musicScoreMapRemove(spanSymbol.id, musicScore);
        }
    }
}

// 添加单谱表
export function addSingleStaff(newSingleStaff: SingleStaff, currSelected: SingleStaff | MultipleStaves, musicScore: MusicScore, position: 'after' | 'before' | number = 'after') {

    if (currSelected.msTypeName === MsTypeNameEnum.SingleStaff) {
        if (typeof position === 'number') {
            console.error('以单谱表为定位元素添加单谱表时，position只可以传after或before')
            return
        }
        const multipleStaves = getDataWithIndex(currSelected.index, musicScore).multipleStaves
        if (!multipleStaves) return console.error("复谱表表不存在，单谱表插入失败");
        const array = multipleStaves.singleStaffArray;
        const targetIndex = array.findIndex(item => item === currSelected);
        if (position === 'before') {
            array.splice(targetIndex, 0, newSingleStaff);
        } else {
            array.splice(targetIndex + 1, 0, newSingleStaff);
        }
        // 计算index
        setSingleStaffArrayIndex(multipleStaves)
        // 更新跨小节符号
        const spanSymbolSet = getMultipleStavesRelatedSpanSymbolList(multipleStaves, musicScore)
        updateSpanSymbolView(spanSymbolSet, musicScore)
    } else if (currSelected.msTypeName === MsTypeNameEnum.MultipStaves) {
        const array = currSelected.singleStaffArray
        if (position === -1 || typeof position === 'string') {
            array.push(newSingleStaff)
        } else if (position >= 0 && position <= array.length) {
            array.splice(position, 0, newSingleStaff)
        } else {
            console.error('索引有误，单谱表添加失败')
            return
        }
        // 计算index
        setSingleStaffArrayIndex(currSelected)
        // 更新跨小节符号
        const spanSymbolSet = getMultipleStavesRelatedSpanSymbolList(currSelected, musicScore)
        updateSpanSymbolView(spanSymbolSet, musicScore)
    }
    // 更新map
    musicScoreMapAdd(newSingleStaff, musicScore)
}

// 删除单谱表
export function removeSingleStaff(
    singleStaff: SingleStaff,
    musicScore: MusicScore,
) {
    const multipleStaves = getDataWithIndex(singleStaff.index, musicScore).multipleStaves
    if (!multipleStaves) return console.error("复谱表表不存在，单谱表移除失败")
    // 如果是复谱表内最后的单谱表，则不可以删除
    if (multipleStaves && multipleStaves.singleStaffArray.length <= 1) return console.error("复谱表内至少保留一个单谱表")
    const array = multipleStaves.singleStaffArray;
    const index = array.findIndex(item => item === singleStaff);
    if (index === -1) return console.error("找不到目标单谱表")
    array.splice(index, 1);
    // 更新map
    musicScoreMapRemove(singleStaff.id, musicScore)
    // 更新index
    setSingleStaffArrayIndex(multipleStaves)
    // 删除相关联的跨小节符号
    removeSingleStaffRelatedSpanSymbol(singleStaff, musicScore)
}

// 添加复谱表
export function addMultipleStaves(newMultipleStaves: MultipleStaves, currSelected: MultipleStaves, musicScore: MusicScore, position: number = -1) {
    if (currSelected.msTypeName === MsTypeNameEnum.MultipStaves) {
        const array = musicScore.multipleStavesArray;
        const targetIndex = array.findIndex(item => item === currSelected);
        if (position === -1) {
            array.push(newMultipleStaves)
        } else if (position >= 0 && position <= array.length) {
            array.splice(position, 0, newMultipleStaves)
        } else {
            console.error('索引有误，复谱表添加失败')
            return
        }
        // 更新index
        setMultipleStavesIndex(musicScore)
        // 更新跨小节符号
        const spanSymbolSet = getMultipleStavesRelatedSpanSymbolList(currSelected, musicScore)
        // 更新跨小节符号视图
        updateSpanSymbolView(spanSymbolSet, musicScore)
    }
    // 更新map
    musicScoreMapAdd(newMultipleStaves, musicScore)
}

// 删除复谱表
export function removeMultipleStaves(
    multipleStaves: MultipleStaves,
    musicScore: MusicScore,
) {
    // 如果是谱表内最后的复谱表，则不可以删除
    if (musicScore.multipleStavesArray.length <= 1) return console.error("")
    const array = musicScore.multipleStavesArray
    const index = array.findIndex(item => item === multipleStaves);
    if (index === -1) return console.error("找不到目标复谱表")
    array.splice(index, 1);
    // 更新map
    musicScoreMapRemove(multipleStaves.id, musicScore)
    // 更新index
    setMultipleStavesIndex(musicScore)
    // 更新跨小节符号
    const spanSymbolSet = getMusicScoreRelatedSpanSymbolList(musicScore)
    // 更新跨小节符号视图
    updateSpanSymbolView(spanSymbolSet, musicScore)
    // 删除相关联的跨小节符号
    removeMultipleStavesRelatedSpanSymbol(multipleStaves, musicScore)

}

// 更新符号属性
export function updateMsSymbol(oldMsSymbol: MsSymbol, newProperties: Partial<MsSymbol>, musicScore: MusicScore) {
    Object.assign(oldMsSymbol, newProperties);
    // 更新跨小节符号视图
    const singleStaff = getDataWithIndex(oldMsSymbol.index, musicScore).singleStaff as SingleStaff || null;
    if (!singleStaff) return
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

// 添加变音符号
export function addAccidental(noteHead: NoteHead, accidental: AccidentalMsSymbol, musicScore: MusicScore) {
    accidental.index = noteHead.index
    noteHead.msSymbolArray.push(accidental)
    // 更新跨小节符号视图
    const singleStaff = getDataWithIndex(noteHead.index, musicScore).singleStaff as SingleStaff || null;
    if (!singleStaff) return
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

// 删除变音符号
export function removeAccidental(noteHead: NoteHead, musicScore: MusicScore) {
    const index = noteHead.msSymbolArray.findIndex((item) => item.type === MsSymbolTypeEnum.Accidental);
    if (index !== -1) {
        noteHead.msSymbolArray.splice(index, 1);
    }

    // 更新跨小节符号视图
    const singleStaff = getDataWithIndex(noteHead.index, musicScore).singleStaff as SingleStaff || null;
    if (!singleStaff) return
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

// 更换变音符号
export function changeAccidental(noteHead: NoteHead, accidentalType: AccidentalEnum | null, musicScore: MusicScore) {
    if (!accidentalType) { // 未选择变音符号视为删除
        removeAccidental(noteHead, musicScore)
        return
    }
    const accidentalIndex = noteHead.msSymbolArray.findIndex((item: MsSymbol) => item.type === MsSymbolTypeEnum.Accidental);
    if (accidentalIndex === -1) { // 不存在变音符号
        const accidental = msSymbolTemplate({
            type: MsSymbolTypeEnum.Accidental,
            accidental: accidentalType
        }) as AccidentalMsSymbol;

        addAccidental(noteHead, accidental, musicScore)
    } else { // 变音符号已存在
        const accidental = noteHead.msSymbolArray[accidentalIndex]
        updateMsSymbol(accidental, {accidental: accidentalType}, musicScore)
    }
}

// 更换音符时值
export function changeNoteChronaxie(note: MsSymbol, newChronaxie: ChronaxieEnum, musicScore: MusicScore) {
    if (note.type !== MsSymbolTypeEnum.NoteHead) {
        return console.error("符号类型有误，时值更改失败。请传入音符");
    }
    if (note.chronaxie === newChronaxie) {
        return
    }
    // 更换时值
    note.chronaxie = newChronaxie
    const noteStem = note.msSymbolArray.find((item) => {
        return item.type === MsSymbolTypeEnum.NoteStem
    })
    const noteTail = note.msSymbolArray.find((item) => {
        return item.type === MsSymbolTypeEnum.NoteTail
    }) as (NoteTail | null)
    // 全音符且noteStem存在，去掉noteStem
    if ([ChronaxieEnum.whole].includes(newChronaxie) && noteStem) {
        removeChildMsSymbol(noteStem, note, musicScore)
    }
    // 非全音符且noteStem不存在，新增noteStem
    if (![ChronaxieEnum.whole].includes(newChronaxie) && !noteStem) {
        const newNoteStem = msSymbolTemplate({type: MsSymbolTypeEnum.NoteStem})
        addChildMsSymbol(newNoteStem, note, musicScore)
    }
    // 全,二分，四分音符且noteTail存在，去掉noteTail
    if ([ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter
    ].includes(newChronaxie) && noteTail) {
        removeChildMsSymbol(noteTail, note, musicScore)
    }
    // 非全,二分，四分音符且noteTail存在，更新noteTail
    if (![ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter
    ].includes(newChronaxie) && noteTail) {
        updateMsSymbol(noteTail, {chronaxie: newChronaxie}, musicScore)
    }
    // 非全,二分，四分音符且noteTail不存在，添加noteTail
    if (![ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter
    ].includes(newChronaxie) && !noteTail) {
        const newNoteTail = msSymbolTemplate({
            type: MsSymbolTypeEnum.NoteTail,
            chronaxie: newChronaxie
        })
        addChildMsSymbol(newNoteTail, note, musicScore)
    }
}

// 更换休止符时值
export function changeRestChronaxie(rest: MsSymbol, newChronaxie: ChronaxieEnum, musicScore: MusicScore) {
    if (rest.type !== MsSymbolTypeEnum.Rest) {
        return console.error("符号类型有误，时值更改失败。休止符");
    }
    if (rest.chronaxie === newChronaxie) {
        return
    }
    // 更换时值
    rest.chronaxie = newChronaxie
}

export function addBindingStartId(msData: MsSymbol | Measure | SingleStaff, id: number) {
    msData.bindingStartId.push(id)
}

export function addBindingEndId(msData: MsSymbol | Measure | SingleStaff, id: number) {
    msData.bindingEndId.push(id)
}

export function removeBindingStartId(msData: MsSymbol | Measure | SingleStaff, id: number) {
    const index = msData.bindingStartId.indexOf(id)
    if (index !== -1) {
        msData.bindingStartId.splice(index, 1)
    }
}

export function removeBindingEndId(msData: MsSymbol | Measure | SingleStaff, id: number) {
    const index = msData.bindingEndId.indexOf(id)
    if (index !== -1) {
        msData.bindingEndId.splice(index, 1)
    }
}

// 移除跨小节符号
export function removeSpanSymbol(spanSymbol: SpanSymbol, musicScore: MusicScore) {
    const index = musicScore.spanSymbolArray.indexOf(spanSymbol)
    const bindingStartId = spanSymbol.startTargetId
    const bindingEndId = spanSymbol.endTargetId

    musicScore.spanSymbolArray.splice(index, 1)
    // 删除相关联对象中的绑定id
    const id = spanSymbol.id
    const bindingStartTarget = musicScore.map[bindingStartId]
    if (bindingStartTarget && 'bindingStartId' in bindingStartTarget) {
        const bindingStartIdIndex = bindingStartTarget.bindingStartId.indexOf(id)
        if (bindingStartIdIndex !== -1) {
            bindingStartTarget.bindingStartId.splice(index, 1)
        }
    }
    const bindingEndTarget = musicScore.map[bindingEndId]
    if (bindingEndTarget && 'bindingEndId' in bindingEndTarget) {
        const bindingEndIdIndex = bindingEndTarget.bindingEndId.indexOf(id)
        if (bindingEndIdIndex !== -1) {
            bindingEndTarget.bindingEndId.splice(index, 1)
        }
    }
}

// 往小节上添加谱号, 因为定宽容器的位置特殊，所以要单独拿出一个方法去处理
export function addClefToMeasure(clefSymbolContainer: MsSymbolContainer, measure: Measure, musicScore: MusicScore) {
    const singleStaff = getDataWithIndex(measure.index, musicScore).singleStaff
    if (clefSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.Clef_f) {
        // 如果有前置小节线，谱号需要添加到前置小节线之后
        const barLine_f = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine_f
        })
        if (barLine_f) { // 前置谱号存在
            const index = barLine_f.index.msSymbolContainerIndex
            if (index == null) return console.error("前置小节线索引异常，谱号添加失败")
            measure.msSymbolContainerArray.splice(index + 1, 0, clefSymbolContainer)
        } else { // 前置谱号不存在
            measure.msSymbolContainerArray.splice(0, 0, clefSymbolContainer)

        }
    } else if (clefSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.Clef) {
        // 如果有小节线，谱号需要添加到前置小节线之前
        const barLine = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine
        })
        if (barLine) { // 小节线存在
            const index = barLine.index.msSymbolContainerIndex
            if (index == null) return console.error("小节线索引异常，谱号添加失败")
            measure.msSymbolContainerArray.splice(index, 0, clefSymbolContainer)
        } else { // 小节线不存在
            measure.msSymbolContainerArray.push(clefSymbolContainer)
        }

    }
    if (!singleStaff) return console.error('单谱表查找出错，谱号添加失败')
    // 更新索引
    setMeasureArrayIndex(singleStaff)
    // 更新跨小节符号视图
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

// 往小节上添加调号
export function addKeySignatureToMeasure(keySignatureSymbolContainer: MsSymbolContainer, measure: Measure, musicScore: MusicScore) {
    const singleStaff = getDataWithIndex(measure.index, musicScore).singleStaff
    if (keySignatureSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.KeySignature) {
        // 如果有前置谱号，调号需要添加到前置谱号之后
        const clef_f = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.Clef_f
        })
        // 如果有前置小节线，谱号需要添加到前置小节线之后
        const barLine_f = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine_f
        })
        if (clef_f) { // 前置谱号存在
            const index = clef_f.index.msSymbolContainerIndex
            if (index == null) return console.error("前置谱号号索引异常，调号添加失败")
            measure.msSymbolContainerArray.splice(index + 1, 0, keySignatureSymbolContainer)
        } else if (barLine_f) { // 前置小节线存在
            const index = barLine_f.index.msSymbolContainerIndex
            if (index == null) return console.error("前置小节线索引异常，调号添加失败")
            measure.msSymbolContainerArray.splice(index + 1, 0, keySignatureSymbolContainer)
        } else {
            measure.msSymbolContainerArray.splice(0, 0, keySignatureSymbolContainer)
        }
    }
    if (!singleStaff) return console.error('单谱表查找出错，谱号添加失败')
    // 更新索引
    setMeasureArrayIndex(singleStaff)
    // 更新跨小节符号视图
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

// 往小节上添加拍号
export function addTimeSignatureToMeasure(timeSignatureContainer: MsSymbolContainer, measure: Measure, musicScore: MusicScore) {

    const singleStaff = getDataWithIndex(measure.index, musicScore).singleStaff
    if (timeSignatureContainer.msSymbolArray[0].type === MsSymbolTypeEnum.TimeSignature) {
        // 如果有调号，拍号号需要添加到调号之后
        const keySignature = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.KeySignature
        })
        // 如果有前置谱号，调号需要添加到前置谱号之后
        const clef_f = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.Clef_f
        })
        // 如果有前置小节线，谱号需要添加到前置小节线之后
        const barLine_f = measure.msSymbolContainerArray.find((curMsSymbolContainer) => {
            return curMsSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine_f
        })
        if (keySignature) { // 调号存在
            const index = keySignature.index.msSymbolContainerIndex
            if (index == null) return console.error("调号索引异常，调号添加失败")
            measure.msSymbolContainerArray.splice(index + 1, 0, timeSignatureContainer)
        } else if (clef_f) { // 前置谱号存在
            const index = clef_f.index.msSymbolContainerIndex
            if (index == null) return console.error("前置谱号索引异常，调号添加失败")
            measure.msSymbolContainerArray.splice(index + 1, 0, timeSignatureContainer)
        } else if (barLine_f) { // 前置小节线存在
            const index = barLine_f.index.msSymbolContainerIndex
            if (index == null) return console.error("前置小节线索引异常，调号添加失败")
            measure.msSymbolContainerArray.splice(index + 1, 0, timeSignatureContainer)
        } else {
            measure.msSymbolContainerArray.splice(0, 0, timeSignatureContainer)
        }
    }
    if (!singleStaff) return console.error('单谱表查找出错，谱号添加失败')
    // 更新索引
    setMeasureArrayIndex(singleStaff)
    // 更新跨小节符号视图
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

// 往小节上添加小节线
export function addBarLineToMeasure(barLineContainer: MsSymbolContainer, measure: Measure, musicScore: MusicScore) {
    const singleStaff = getDataWithIndex(measure.index, musicScore).singleStaff
    if (barLineContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine_f) {
        measure.msSymbolContainerArray.unshift(barLineContainer)
    } else if (barLineContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine) {
        measure.msSymbolContainerArray.push(barLineContainer)
    }
    if (!singleStaff) return console.error('单谱表查找出错，谱号添加失败')
    // 更新索引
    setMeasureArrayIndex(singleStaff)
    // 更新跨小节符号视图
    const spanSymbolList = getSingleStaffRelatedSpanSymbolList(singleStaff, musicScore)
    updateSpanSymbolView(spanSymbolList, musicScore)
}

export function changeClef(clef: ClefEnum, measure: Measure, musicScore: MusicScore) {
    const index = measure.index
    // 如果是单谱表内第一个小节
    if (index.measureIndex === 0) {
        const clefSymbol = measure.msSymbolContainerArray.find((msSymbolContainer) => {
            return msSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.Clef_f
        })?.msSymbolArray[0] as (ClefMsSymbol | undefined)
        if (clefSymbol) {
            updateMsSymbol(clefSymbol, {clef}, musicScore)
        } else { // clef不存在则添加clef
            const newClef = msSymbolTemplate({type: MsSymbolTypeEnum.Clef_f, clef})
            const newMsSymbolContainer = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.frontFixed})
            newMsSymbolContainer.msSymbolArray.push(newClef)
            addClefToMeasure(newMsSymbolContainer, measure, musicScore)
        }
    } else { // 非第一个单谱表，要在前一个小节加上结尾谱号
        const index = JSON.parse(JSON.stringify(measure.index))
        index.measureIndex -= 1
        const preMeasure = getDataWithIndex(index, musicScore).measure
        if (!preMeasure) return console.error("找不到当前小节的前一个小节，谱号添加失败")
        const clefSymbol = preMeasure.msSymbolContainerArray.find((msSymbolContainer) => {
            return msSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.Clef
        })?.msSymbolArray[0] as (ClefMsSymbol | undefined)
        if (clefSymbol) {
            updateMsSymbol(clefSymbol, {clef}, musicScore)
        } else { // clef不存在则添加clef
            const newClef = msSymbolTemplate({type: MsSymbolTypeEnum.Clef, clef})
            const newMsSymbolContainer = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.rearFixed})
            newMsSymbolContainer.msSymbolArray.push(newClef)
            addClefToMeasure(newMsSymbolContainer, preMeasure, musicScore)
        }
    }
}

// 更改调号
export function changeKeySignature(keySignature: KeySignatureEnum, measure: Measure, musicScore: MusicScore) {
    const keySignatureSymbol = measure.msSymbolContainerArray.find((msSymbolContainer) => {
        return msSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.KeySignature
    })?.msSymbolArray[0] as (KeySignatureMsSymbol | undefined)
    if (keySignatureSymbol) {
        updateMsSymbol(keySignatureSymbol, {keySignature}, musicScore)
    } else { // keySignature不存在则添加keySignature
        const newKeySignature = msSymbolTemplate({type: MsSymbolTypeEnum.KeySignature, keySignature})
        const newMsSymbolContainer = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.frontFixed})
        newMsSymbolContainer.msSymbolArray.push(newKeySignature)
        addKeySignatureToMeasure(newMsSymbolContainer, measure, musicScore)
    }
}

// 更改拍号
export function changeTimeSignature(timeSignature: TimeSignature, measure: Measure, musicScore: MusicScore) {
    const timeSignatureSymbol = measure.msSymbolContainerArray.find((msSymbolContainer) => {
        return msSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.TimeSignature
    })?.msSymbolArray[0] as (TimeSignatureMsSymbol | undefined)
    if (timeSignatureSymbol) {
        updateMsSymbol(timeSignatureSymbol, {timeSignature}, musicScore)
    } else { // timeSignature不存在则添加keySignature
        const newKeySignature = msSymbolTemplate({type: MsSymbolTypeEnum.TimeSignature, timeSignature})
        const newMsSymbolContainer = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.frontFixed})
        newMsSymbolContainer.msSymbolArray.push(newKeySignature)
        addTimeSignatureToMeasure(newMsSymbolContainer, measure, musicScore)
    }
}

// 更改小节线
export function changeBarLine(barLineType: BarLineTypeEnum, measure: Measure, musicScore: MusicScore) {
    const isFront = [BarLineTypeEnum.reverseFinal, BarLineTypeEnum.startRepeatSign].includes(barLineType)
    if (isFront) { // 插入前置小节线逻辑
        const barLineSymbol = measure.msSymbolContainerArray.find((msSymbolContainer) => {
            return msSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine_f
        })?.msSymbolArray[0] as (BarLine | undefined)
        if (barLineSymbol) {
            updateMsSymbol(barLineSymbol, {barLineType}, musicScore)
        } else { // barLine_f不存在则添加keySignature
            const newBarLine = msSymbolTemplate({type: MsSymbolTypeEnum.BarLine_f, barLineType})
            const newBarLineContainer = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.frontFixed})
            newBarLineContainer.msSymbolArray.push(newBarLine)
            addBarLineToMeasure(newBarLineContainer, measure, musicScore)
        }

    } else { // 插入后置小节线逻辑
        const barLineSymbol = measure.msSymbolContainerArray.find((msSymbolContainer) => {
            return msSymbolContainer.msSymbolArray[0].type === MsSymbolTypeEnum.BarLine
        })?.msSymbolArray[0] as (BarLine | undefined)
        if (barLineSymbol) {
            updateMsSymbol(barLineSymbol, {barLineType}, musicScore)
        } else { // keySignature不存在则添加keySignature
            const newKeySignature = msSymbolTemplate({type: MsSymbolTypeEnum.BarLine, barLineType})
            const newMsSymbolContainer = msSymbolContainerTemplate({type: MsSymbolContainerTypeEnum.rearFixed})
            newMsSymbolContainer.msSymbolArray.push(newKeySignature)
            addBarLineToMeasure(newMsSymbolContainer, measure, musicScore)
        }
    }

}


// 更新bemId
export function changeBeamId(newBeamId: number, noteHead: NoteHead, musicScore: MusicScore) {
    noteHead.beamId = newBeamId

}

// 更新符杠方向
export function changeNoteStemDirection(direction: 'up' | 'down', noteStem: NoteStem) {
    noteStem.direction = direction
    noteStem.vueKey = Math.random() * Date.now()
}

// 更新符尾方向
export function changeNoteTailDirection(direction: 'up' | 'down', noteTail: NoteTail) {
    noteTail.direction = direction
    noteTail.vueKey = Math.random() * Date.now()
}


// 成组音符更新
export function updateBeamGroupNote(beamId: number, measure: Measure, musicScore: MusicScore) {
    const group: { noteStem: NoteStem, noteTail: NoteTail }[] = []
    let direction: 'up' | 'down' = 'up'
    // main_lin_3 = 4
    let farthestRegionIndex: number = 4
    let start = false
    for (const i in measure.msSymbolContainerArray) {
        const msSymbolContainer = measure.msSymbolContainerArray[i]
        for (const j in msSymbolContainer.msSymbolArray) {
            const mainSymbol = msSymbolContainer.msSymbolArray[j]
            // 找到音符头存储(这里要考虑多声部，container中可能有多个音符头)
            if (mainSymbol.type === MsSymbolTypeEnum.NoteHead
                && ![ChronaxieEnum.whole, ChronaxieEnum.half, ChronaxieEnum.quarter].includes(mainSymbol.chronaxie)) {
                const distanceFromMiddle = Math.abs(staffRegionToIndex(mainSymbol.region) - 4)
                const currentFarthest = Math.abs(farthestRegionIndex - 4)
                if (distanceFromMiddle > currentFarthest) {
                    farthestRegionIndex = staffRegionToIndex(mainSymbol.region)
                }

                const noteStem = mainSymbol.msSymbolArray.find(item => item.type === MsSymbolTypeEnum.NoteStem) as NoteStem | null
                const noteTail = mainSymbol.msSymbolArray.find(item => item.type === MsSymbolTypeEnum.NoteTail) as NoteTail | null
                if (noteTail && noteStem && mainSymbol.beamId === beamId) {
                    group.push({noteStem, noteTail})
                    start = true
                }
            } else if (start) {
                break
            }
        }
    }
    // 更新 direction  main_space_2 = 3
    direction = farthestRegionIndex >= 3 ? 'down' : 'up'
    for (const i in group) {
        const noteStem = group[i].noteStem
        const noteTail = group[i].noteTail
        changeNoteStemDirection(direction, noteStem)
        changeNoteTailDirection(direction, noteTail)
    }
}