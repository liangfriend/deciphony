import {XMLParser} from 'fast-xml-parser'
import {
    AccidentalTypeEnum,
    BeamTypeEnum,
    ClefTypeEnum,
    KeySignatureTypeEnum,
    MusicScore,
    MusicScoreTypeEnum,
    NoteSymbolTypeEnum,
    TimeSignatureTypeEnum,
    type NoteSymbol,
} from 'deciphony-renderer'
import {
    createAugmentationDot,
    createClef,
    createGrandStaff,
    createKeySignature,
    createMeasure,
    createMusicScore,
    createNoteRest,
    createNoteSymbol,
    createNotesInfo,
    createSingleStaff,
    createTimeSignature,
    newId,
} from '../dr-edit/score-builder'
import {getNoteRegionAndAccidental} from '../scoreUtil'
import {
    parseXmlNoteBlock,
    pitchToMidi,
    xmlAccidentalToPriority,
    xmlClefToType,
    xmlDurationToChronaxie,
    xmlKeyToType,
    xmlTimeToType,
} from './xmlSymbolParse'

/**
 * 使用fast-xml-parser解析musicxml文件成json数据
 */
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    trimValues: true,
    preserveOrder: true,
    ignoreDeclaration: true,
})

export async function getXmlJson(file: File) {
    if (!file) {
        return null
    }

    const text = await file.text()

    const trimmed = text.trimStart()

    if (!trimmed.startsWith('<')) {
        throw new Error('内容不是 XML 文本（应以 < 开头）。')
    }

    return xmlParser.parse(text)
}

function xmlDataFor(data: any[], cb: Function) {
    for (const index in data) {
        const item = data[index];
        for (const key of Object.keys(item)) {
            cb({key, index, item, length: data.length});
        }
    }
};

/**
 * musicXml转musicScore
 */
export function xmlToMusicScore(xmlData: any): MusicScore {
    const root = xmlData[0]['score-partwise'];
    // 每行谱表当前信息
    const staffStates = Array.from({length: 10}, (_, i) => ({
        curClef: i === 0 ? ClefTypeEnum.Treble : ClefTypeEnum.Bass,
        curKeySignature: KeySignatureTypeEnum.C,
        curTimeSignature: TimeSignatureTypeEnum['4_4'],
        divisions: 4,
    }))
    /** 第零步：创建空 musicScore，并加入一个空复谱表（单谱表后续按 staff 数量再补） */
    const musicScore = createMusicScore({
        type: MusicScoreTypeEnum.StandardStaff,
        width: 800,
        height: 600,
    })
    musicScore.grandStaffs.push(createGrandStaff({withDefaultStaff: false}))
    /**
     * 第一步
     * 创建足够多的单谱表，以适应所有measure的staff值
     * 10个
     */
    for (let i = 0; i < 10; i++) {
        musicScore.grandStaffs[0].staves.push(createSingleStaff({withDefaultMeasure: false}))
    }

    /**
     * 第二步
     * 找到第一个part属性，遍历
     * 遇见sound更新musicScore.bpm
     * 遇见measure, 就给所有单谱表加一个空小节
     */
    const firstPart = root.find((item: any) => item.part)?.part
    if (firstPart) {
        for (const partItem of firstPart) {
            if (partItem.sound != null) {
                const tempo = partItem[':@']?.['@_tempo']
                if (tempo != null) musicScore.bpm = Number(tempo)
            }
            if (partItem.measure) {
                for (const singleStaff of musicScore.grandStaffs[0].staves) {
                    singleStaff.measures.push(createMeasure({}))
                }
            }
        }
    }

    /**
     * 第三步，
     * 遍历part
     * 检查measure的索引第一项和索引最后一项
     * 如果索引第一项是attributes, 保存divisions, 解析key为所有该索引小节前置调号，解析time为所有该索引小节前置拍号，解析clef为小节前置谱号，clef用number属性判断属于哪个单谱表的该索引小节
     * 如果索引最后一项是attributes, 保存divisions, 解析key为所有该索引小节后置调号，解析time为所有该索引小节后置拍号，解析clef为小节后置谱号，clef用number属性判断属于哪个单谱表的该索引小节
     * 加三个辅助函数，解析xml中谱号，调号，拍号
     */
    let divisions = 1
    const grandStaff = musicScore.grandStaffs[0]
    const pendingNoteClef: (ClefTypeEnum | undefined)[] = Array(10).fill(undefined)
    if (firstPart) {
        let measureIndex = 0
        for (const partItem of firstPart) {
            if (!partItem.measure) continue

            const measureBlock = partItem.measure

            const updateStaffStates = (attributesBlock: any[]) => {
                for (const attrItem of attributesBlock) {
                    if (attrItem.divisions) {
                        divisions = Number(attrItem.divisions[0]?.['#text'] ?? divisions)
                        for (const state of staffStates) state.divisions = divisions
                    }
                    if (attrItem.key) {
                        const keyType = xmlKeyToType(attrItem)
                        const staffNum = attrItem[':@']?.['@_number']
                        if (staffNum != null) {
                            staffStates[Number(staffNum) - 1].curKeySignature = keyType
                        } else {
                            for (const state of staffStates) state.curKeySignature = keyType
                        }
                    }
                    if (attrItem.time) {
                        const timeType = xmlTimeToType(attrItem)
                        if (!timeType) continue
                        const staffNum = attrItem[':@']?.['@_number']
                        if (staffNum != null) {
                            staffStates[Number(staffNum) - 1].curTimeSignature = timeType
                        } else {
                            for (const state of staffStates) state.curTimeSignature = timeType
                        }
                    }
                    if (attrItem.clef) {
                        const clefType = xmlClefToType(attrItem)
                        const staffIdx = Number(attrItem[':@']?.['@_number'] ?? 1) - 1
                        staffStates[staffIdx].curClef = clefType
                    }
                }
            }

            const applyMeasureAttributes = (attributesBlock: any[], slot: 'f' | 'b') => {
                for (const attrItem of attributesBlock) {
                    if (attrItem.key) {
                        const keySig = createKeySignature(xmlKeyToType(attrItem))
                        const staffNum = attrItem[':@']?.['@_number']
                        const staffList = staffNum != null
                            ? [grandStaff.staves[Number(staffNum) - 1]]
                            : grandStaff.staves
                        for (const staff of staffList) {
                            const measure = staff?.measures[measureIndex]
                            if (!measure) continue
                            if (slot === 'f') measure.keySignature_f = keySig
                            else measure.keySignature_b = keySig
                        }
                    }
                    if (attrItem.time) {
                        const timeType = xmlTimeToType(attrItem)
                        if (!timeType) continue
                        const timeSig = createTimeSignature(timeType)
                        const staffNum = attrItem[':@']?.['@_number']
                        const staffList = staffNum != null
                            ? [grandStaff.staves[Number(staffNum) - 1]]
                            : grandStaff.staves
                        for (const staff of staffList) {
                            const measure = staff?.measures[measureIndex]
                            if (!measure) continue
                            if (slot === 'f') measure.timeSignature_f = timeSig
                            else measure.timeSignature_b = timeSig
                        }
                    }
                    if (attrItem.clef) {
                        const clef = createClef(xmlClefToType(attrItem))
                        const staffNum = Number(attrItem[':@']?.['@_number'] ?? 1)
                        const measure = grandStaff.staves[staffNum - 1]?.measures[measureIndex]
                        if (!measure) continue
                        if (slot === 'f') measure.clef_f = clef
                        else measure.clef_b = clef
                    }
                }
            }

            let currentTime = 0
            const staffWrittenDivisions = Array(10).fill(0)

            const appendRestGaps = (staffIdx: number, targetTime: number) => {
                const measure = grandStaff.staves[staffIdx]?.measures[measureIndex]
                if (!measure) return
                const div = staffStates[staffIdx].divisions
                while (staffWrittenDivisions[staffIdx] < targetTime) {
                    const gap = targetTime - staffWrittenDivisions[staffIdx]
                    const chronaxie = xmlDurationToChronaxie(gap, div)
                    const span = (chronaxie / 64) * div
                    measure.notes.push(createNoteRest({chronaxie}))
                    staffWrittenDivisions[staffIdx] += span
                    if (span <= 0) break
                }
            }

            const applyPendingClef = (slot: {clef?: ReturnType<typeof createClef>}, staffIdx: number) => {
                const pendingClef = pendingNoteClef[staffIdx]
                if (pendingClef != null) {
                    slot.clef = createClef(pendingClef)
                    pendingNoteClef[staffIdx] = undefined
                }
            }

            for (let i = 0; i < measureBlock.length; i++) {
                const measureItem = measureBlock[i]
                const itemKey = Object.keys(measureItem).find((k) => k !== ':@')

                if (itemKey === 'backup') {
                    for (const item of measureItem.backup as any[]) {
                        if (item.duration) {
                            const backupDuration = Number(item.duration[0]?.['#text'] ?? 0)
                            currentTime = Math.max(0, currentTime - backupDuration)
                        }
                    }
                    continue
                }

                if (itemKey === 'attributes') {
                    const attributesBlock = measureItem.attributes
                    updateStaffStates(attributesBlock)
                    if (i === 0) {
                        applyMeasureAttributes(attributesBlock, 'f')
                    } else if (i === measureBlock.length - 1) {
                        applyMeasureAttributes(attributesBlock, 'b')
                    } else {
                        for (const attrItem of attributesBlock) {
                            if (attrItem.clef) {
                                const staffIdx = Number(attrItem[':@']?.['@_number'] ?? 1) - 1
                                pendingNoteClef[staffIdx] = xmlClefToType(attrItem)
                            }
                        }
                    }
                    continue
                }

                if (itemKey !== 'note') continue

                const parsed = parseXmlNoteBlock(measureItem.note, divisions)
                const staffIdx = parsed.staffNum - 1
                const state = staffStates[staffIdx]
                const measure = grandStaff.staves[staffIdx]?.measures[measureIndex]
                if (!measure) continue

                if (parsed.isRest) {
                    if (parsed.isChord) continue
                    appendRestGaps(staffIdx, currentTime)
                    const rest = createNoteRest({
                        chronaxie: parsed.chronaxie,
                        ...(parsed.dotCount > 0
                            ? {augmentationDot: createAugmentationDot(Math.min(parsed.dotCount, 3) as 1 | 2 | 3)}
                            : {}),
                    })
                    applyPendingClef(rest, staffIdx)
                    measure.notes.push(rest)
                    if (parsed.duration > 0) {
                        staffWrittenDivisions[staffIdx] = currentTime + parsed.duration
                        currentTime += parsed.duration
                    }
                    continue
                }

                if (!parsed.pitchBlock) continue
                const midi = pitchToMidi(parsed.pitchBlock)
                if (midi == null) continue

                if (!parsed.isChord) appendRestGaps(staffIdx, currentTime)

                const priority = parsed.accidentalText
                    ? xmlAccidentalToPriority(parsed.accidentalText)
                    : AccidentalTypeEnum.Sharp
                const {region, accidental} = getNoteRegionAndAccidental(
                    state.curClef,
                    midi,
                    state.curKeySignature,
                    priority,
                )
                const beamType = parsed.hasBeam ? BeamTypeEnum.Combined : BeamTypeEnum.None
                const notesInfoOpts = {
                    region,
                    chronaxie: parsed.chronaxie,
                    beamType,
                    ...(parsed.stem ? {direction: parsed.stem} : {}),
                    ...(accidental ? {accidental} : {}),
                    ...(parsed.dotCount > 0
                        ? {augmentationDot: createAugmentationDot(Math.min(parsed.dotCount, 3) as 1 | 2 | 3)}
                        : {}),
                }

                if (parsed.isChord && measure.notes.length) {
                    const last = measure.notes[measure.notes.length - 1]!
                    if ('notesInfo' in last) {
                        (last as NoteSymbol).notesInfo.push(createNotesInfo(notesInfoOpts))
                        continue
                    }
                }

                const note = createNoteSymbol({notesInfo: [notesInfoOpts]})
                applyPendingClef(note, staffIdx)
                measure.notes.push(note)
                if (!parsed.isChord && parsed.duration > 0) {
                    staffWrittenDivisions[staffIdx] = currentTime + parsed.duration
                    currentTime += parsed.duration
                }
            }

            measureIndex++
        }
    }

    /**
     * 第四步
     * 遍历单谱表，如果遍历到最后一个音符或rest都没有，删除该单谱表
     */
    grandStaff.staves = grandStaff.staves.filter((singleStaff) =>
        singleStaff.measures.some((measure) =>
            measure.notes.some(
                (slot) =>
                    'type' in slot
                    && (slot.type === NoteSymbolTypeEnum.Note || slot.type === NoteSymbolTypeEnum.Rest),
            ),
        ),
    )
    /**
     * 第五步
     * 每隔四个小节分割，放到新的复谱表
     */
    const measureCount = grandStaff.staves[0]?.measures.length ?? 0
    if (measureCount > 0) {
        const splitGrandStaffs = []
        for (let start = 0; start < measureCount; start += 4) {
            const newGrandStaff = createGrandStaff({withDefaultStaff: false})
            newGrandStaff.uSpace = grandStaff.uSpace
            newGrandStaff.dSpace = grandStaff.dSpace
            if (grandStaff.linkedStaff) newGrandStaff.linkedStaff = true
            if (grandStaff.bracket) {
                newGrandStaff.bracket = {...grandStaff.bracket, id: newId()}
            }
            for (const sourceStaff of grandStaff.staves) {
                const newStaff = createSingleStaff({withDefaultMeasure: false})
                newStaff.measures = sourceStaff.measures.slice(start, start + 4)
                newGrandStaff.staves.push(newStaff)
            }
            splitGrandStaffs.push(newGrandStaff)
        }
        musicScore.grandStaffs = splitGrandStaffs
    }

    return musicScore
}

/**
 * musicScore转musicXml
 */
export function musicScoreToXml(musicScore: MusicScore): File {

}

function rootSwitch(rootData, musicScore: MusicScore) {
    const {key: rootItemKey, item: rootItem} = rootData;
    switch (rootItemKey) {
        case 'part': {
            const partItems = rootItem[rootItemKey]
            xmlDataFor(partItems, (partData) => {
                partSwitch(partData, musicScore);
            });
            break
        }
    }
}

function partSwitch(partData, musicScore: MusicScore) {
    const {key: partItemKey, item: partItem} = partData;

    switch (partItemKey) {
        case 'measure': {
            
            
            xmlDataFor(partItem[partItemKey], (measureData) => {
                measureSwitch(measureData);
            });

            break;
        }
        case 'sound': {
            
            musicScore.bpm = +partItem[partItemKey][0][':@']['@_tempo'];

            break;
        }
    }
}

function measureSwitch(measureData) {
    const {key: measureItemKey, item: measureItem} = measureData;
    switch (measureItemKey) {
        case ':@': {
            // 这里的操作在外部提前执行了
            break;
        }
        case 'attributes': {
            xmlDataFor(measureItem[measureItemKey], (attributesData) => {
                attributesSwitch(attributesData);
            });
            break;
        }
        case 'note': {
            // 需要先行通过staff判断音符所属小节，然后添加音符
            // let danPuBiaoIndex = 0;
            // let midi = 0;
            // let chronaxie = 0;
            // // const dot = 0;
            // for (const noteAttr of measureItem[measureItemKey]) {
            //   for (const key of Object.keys(noteAttr)) {
            //     if (key === 'staff') {
            //       danPuBiaoIndex = noteAttr[key][0]['#text'] != null ? noteAttr[key][0]['#text'] - 1 : 0;
            //     }
            //     if (key === 'pitch') {
            //       midi = pitchToMidi(noteAttr[key]);
            //     }
            //     if (key === 'type') {
            //       chronaxie = typeToChronaxie(noteAttr[key]);
            //     }
            //     if (key === 'dot') {
            //       // dot = noteAttr[key];
            //     }
            //   }
            // }
            // curDanPuBiao = curFuPuBiao?.danPuBiaoArray[danPuBiaoIndex];
            // curXiaoJie = curDanPuBiao.xiaoJieArray[curDanPuBiao.xiaoJieArray.length - 1];
            //
            // // 插入音符，要选中它的前一个音符
            // editorManager.currentEditor.currentSelected.currentSelectedObjectInfo = {
            //   target: curXiaoJie,
            //   parent: curDanPuBiao
            // };
            // // 添加音符
            // const yinfuindex = new MusicScoreIndex();
            // yinfuindex.fuPuBiaoIndex = curXiaoJie.index.fuPuBiaoIndex;
            // yinfuindex.danPuBiaoIndex = curXiaoJie.index.danPuBiaoIndex;
            // yinfuindex.xiaoJieIndex = curXiaoJie.index.xiaoJieIndex;
            // yinfuindex.shengBuIndex = 0;
            // yinfuindex.yinFuIndex = curXiaoJie.yinFuArray.length ? curXiaoJie.yinFuArray.length : 0;
            // // 根据当前单谱表的调号定位五线谱位置（同 midi 不同调号位置不同）
            // const diaoHao = getCurrentDiaoHao(danPuBiaoIndex);
            // const yinfuValue = musicScoreEditor.getYinFuValue(midi, diaoHao);
            // console.log(
            //   'chicken',
            //   yinfuindex.fuPuBiaoIndex,
            //   yinfuindex.danPuBiaoIndex,
            //   yinfuindex.xiaoJieIndex,
            //   yinfuindex.yinFuIndex,
            //   curDanPuBiao.xiaoJieArray.length,
            //   currentXiaoJieIndex
            // );
            // const str =
            //   yinfuindex.fuPuBiaoIndex +
            //   '-' +
            //   yinfuindex.danPuBiaoIndex +
            //   '-' +
            //   yinfuindex.xiaoJieIndex +
            //   '-' +
            //   yinfuindex.yinFuIndex;
            // if (['0-1-0-0', '0-0-0-0'].includes(str)) {
            // musicScoreEditor.insertYinFu({
            //   value: yinfuValue.value,
            //   yinChang: chronaxie,
            //   yinFuType: midi ? UIYinFuType.YinFu : UIYinFuType.XiuZhiFu,
            //   index: yinfuindex,
            //   midi
            // });
            // }

            // 添加附点
            // if (dot) {
            //
            //   const curYinFu = curXiaoJie.yinFuArray[curXiaoJie.yinFuArray.length - 1];
            //   editorManager.currentEditor.currentSelected.currentSelectedObjectInfo = {
            //     target: curYinFu.yinFuContents[0],
            //     parent: curYinFu
            //   };
            //   musicScoreEditor.updateHouFuDianCountForMusicScoreYinFu(curYinFu, dot);
            // }
            // xmlDataFor(measureItem[measureItemKey], (noteData) => {
            //   noteSwitch(noteData, musicScoreEditor);
            // });
            break;
        }
    }
}

function attributesSwitch(attributesData, musicScoreEditor) {
    const {key: attributesKey, item: attributesItem} = attributesData;
    switch (attributesKey) {
        case 'key': {
            // <key number="N">...<fifths>X</fifths></key>
            // number 指定该调号生效的单谱表（1-based），缺省视为对当前 part 内所有单谱表生效
            // const diaohao = keyToDiaoHao(attributesItem[attributesKey]);
            // const staffAttrRaw = attributesItem[':@']?.['@_number'];
            // if (staffAttrRaw != null) {
            //   const idx = Number(staffAttrRaw) - 1;
            //   if (idx >= 0) danPuBiaoDiaoHao[idx] = diaohao;
            // } else {
            //   // 应用到所有已知单谱表；staves 可能还未解析到，至少先写入 0 号
            //   const total = Math.max(staves, 1);
            //   for (let i = 0; i < total; i++) danPuBiaoDiaoHao[i] = diaohao;
            // }
            break;
        }
        case 'staves': {
            // staves = attributesItem[attributesKey][0]['#text'] || 1;
            //
            // // 因为创建复谱表时自带一个单谱表，所以插入单谱表从索引1开始
            // for (let i = 1; i < staves; i++) {
            //   const index = new MusicScoreIndex();
            //   index.fuPuBiaoIndex = 0;
            //   index.danPuBiaoIndex = i;
            //
            //   musicScoreEditor.insertDanPuBiao(index);
            // }
            // // 在 staves 之前出现的 key（未带 number）默认仅写入了 0 号，这里同步到剩余单谱表
            // if (danPuBiaoDiaoHao.length > 0 && danPuBiaoDiaoHao[0]) {
            //   for (let i = 1; i < staves; i++) {
            //     if (danPuBiaoDiaoHao[i] == null) danPuBiaoDiaoHao[i] = danPuBiaoDiaoHao[0];
            //   }
            // }
            break;
        }
        case 'clef': {
            break;
        }
    }
}

// function noteSwitch(noteData, musicScoreEditor) {
//   const { key: noteKey, item: noteItem } = noteData;
//
//   switch (noteKey) {
//     case 'pitch': {
//       break;
//     }
//     case 'duration': {
//       break;
//     }
//     case 'stem': {
//       break;
//     }
//     case 'staff': {
//       // 这个已经在measureSwitch里提前判断完了
//       break;
//     }
//     case 'voice': {
//       break;
//     }
//   }
// }
