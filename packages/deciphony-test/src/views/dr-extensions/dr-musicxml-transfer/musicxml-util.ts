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
import {buildMusicScoreToXml} from './musicScoreToXml'

// MusicXML ↔ MusicScore 转换入口。
// xmlToMusicScore 为当前主路径；文件末尾 rootSwitch/partSwitch 等为旧版 switch 骨架，逻辑已迁移到 xmlToMusicScore。

/**
 * 使用fast-xml-parser解析musicxml文件成json数据
 */
// preserveOrder: true → 解析结果为有序数组，子节点顺序与 XML 一致（measure 内 backup/note/attributes 顺序很重要）
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  trimValues: true,
  preserveOrder: true,
  ignoreDeclaration: true,
})

/** 读取用户选择的 .xml/.musicxml 文件，校验后以 preserveOrder 结构返回 JSON */
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

/**
 * 遍历 fast-xml-parser preserveOrder 数组的每一项。
 * 每个 item 形如 { measure: [...] } 或 { note: [...] }，对 item 的每个 key 调用 cb。
 * 旧版 switch 解析（rootSwitch → partSwitch → measureSwitch）依赖此工具。
 */
function xmlDataFor(data: any[], cb: Function) {
  for (const index in data) {
    const item = data[index];
    for (const key of Object.keys(item)) {
      cb({key, index, item, length: data.length});
    }
  }
}

/**
 * musicXml转musicScore
 */
export function xmlToMusicScore(xmlData: any): MusicScore {
  // score-partwise：按 part 组织；当前只读第一个 part，多 part 合奏尚未拆分
  const root = xmlData[0]['score-partwise'];
  // 每行谱表当前信息
  // staffStates[i] 跟踪第 i+1 号 staff 的谱号/调号/拍号/divisions，供音符落位与时值换算
  const staffStates = Array.from({length: 10}, (_, i) => ({
    curClef: i === 0 ? ClefTypeEnum.Treble : ClefTypeEnum.Bass,
    curKeySignature: KeySignatureTypeEnum.C,
    curTimeSignature: TimeSignatureTypeEnum['4_4'],
    divisions: 4,
  }))
  // 整体流程：0 建壳 → 1 预建 staff → 2 按 measure 数量铺空小节 → 3 填 attributes/音符 → 4 删空 staff → 5 每 4 小节换行
  /** 第零步：创建空 musicScore，并加入一个空复谱表（单谱表后续按 staff 数量再补） */
  const musicScore = createMusicScore({
    type: MusicScoreTypeEnum.StandardStaff,
    width: 800,
    height: 10000
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
    // divisions：四分音符占多少 duration 单位，来自 <attributes><divisions>
  let divisions = 1
  const grandStaff = musicScore.grandStaffs[0]

  /** 取 preserveOrder 节点的主标签名（忽略 :@ 属性节点） */
  const getMeasureItemKey = (measureItem: Record<string, unknown>): string | undefined =>
    Object.keys(measureItem).find((k) => k !== ':@')

  /** 当前项之后第一个有效子节点的标签名；无则 undefined */
  const getNextMeasureItemKey = (measureBlock: unknown[], index: number): string | undefined => {
    for (let j = index + 1; j < measureBlock.length; j++) {
      const key = getMeasureItemKey(measureBlock[j] as Record<string, unknown>)
      if (key) return key
    }
    return undefined
  }

  if (firstPart) {
    let measureIndex = 0
    for (const partItem of firstPart) {
      if (!partItem.measure) continue

      const measureBlock = partItem.measure

      // 仅更新内存状态，不写回 measure 对象（供后续 note 解析用）
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

      const applyMeasureKeyTime = (attributesBlock: any[], slot: 'f' | 'b') => {
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
        }
      }

      const applyMeasureClef = (attributesBlock: any[], slot: 'f' | 'b') => {
        for (const attrItem of attributesBlock) {
          if (!attrItem.clef) continue
          const clef = createClef(xmlClefToType(attrItem))
          const staffNum = Number(attrItem[':@']?.['@_number'] ?? 1)
          const measure = grandStaff.staves[staffNum - 1]?.measures[measureIndex]
          if (!measure) continue
          if (slot === 'f') measure.clef_f = clef
          else measure.clef_b = clef
        }
      }

      // 尚未写入音符/休止符前遇到的 attributes：谱号/调号/拍号一律前置
      // 已写入后：下一项为 note 则 clef 挂到下一颗音符；否则（无下一项或下一项非 note）全部后置
      const pendingNoteClef: (ClefTypeEnum | undefined)[] = Array(10).fill(undefined)

      const queueClefToNextNote = (attributesBlock: any[]) => {
        for (const attrItem of attributesBlock) {
          if (!attrItem.clef) continue
          const staffIdx = Number(attrItem[':@']?.['@_number'] ?? 1) - 1
          pendingNoteClef[staffIdx] = xmlClefToType(attrItem)
        }
      }

      // MusicXML 用 divisions 累计拍位；backup 会回退 currentTime（多声部同小节）
      let currentTime = 0
      // 各 staff 已写入的 divisions 终点，用于在音符前补休止符填空洞
      const staffWrittenDivisions = Array(10).fill(0)

      // 若下一音符的 currentTime 晚于已写入位置，用休止符补齐（隐式休止）
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

      // 把 pendingNoteClef 挂到即将插入的音符/休止符，并清空 pending
      const applyPendingClef = (slot: { clef?: ReturnType<typeof createClef> }, staffIdx: number) => {
        const pendingClef = pendingNoteClef[staffIdx]
        if (pendingClef != null) {
          slot.clef = createClef(pendingClef)
          pendingNoteClef[staffIdx] = undefined
        }
      }

      let hasSeenNoteOrRest = false

      // 按 XML 子节点顺序遍历：backup → attributes → note …
      for (let i = 0; i < measureBlock.length; i++) {
        const measureItem = measureBlock[i]
        const itemKey = getMeasureItemKey(measureItem)
        const nextKey = getNextMeasureItemKey(measureBlock, i)

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
          if (!hasSeenNoteOrRest) {
            applyMeasureKeyTime(attributesBlock, 'f')
            applyMeasureClef(attributesBlock, 'f')
          } else if (nextKey === 'note') {
            applyMeasureKeyTime(attributesBlock, 'f')
            queueClefToNextNote(attributesBlock)
          } else {
            applyMeasureKeyTime(attributesBlock, 'b')
            applyMeasureClef(attributesBlock, 'b')
          }
          continue
        }

        if (itemKey !== 'note') continue

        // pitch/rest/chord/beam/dot/staff 等统一在 xmlSymbolParse 中解析
        const parsed = parseXmlNoteBlock(measureItem.note, divisions)
        const staffIdx = parsed.staffNum - 1
        const state = staffStates[staffIdx]
        const measure = grandStaff.staves[staffIdx]?.measures[measureIndex]
        if (!measure) continue

        if (parsed.isRest) {
          if (parsed.isChord) continue
          hasSeenNoteOrRest = true
          appendRestGaps(staffIdx, currentTime)
          // 休止符不占和弦位，但会推进 currentTime
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

        hasSeenNoteOrRest = true
        if (!parsed.isChord) appendRestGaps(staffIdx, currentTime)

        // midi → 五线谱 region；结合当前谱号、调号决定升/降记谱
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

        // <chord/>：与上一 note 同时发声，追加到同一 NoteSymbol 的 notesInfo
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
  // 单行展示：每 4 小节切成一行复谱表（系统），保留 uSpace/dSpace/bracket/linkedStaff
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
  return buildMusicScoreToXml(musicScore)
}

// ---------- 以下为旧版 switch 骨架，供对照 MusicXML 节点结构；实际导入走 xmlToMusicScore ----------

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
      // 旧路径：逐 measure 子节点分发；现由 xmlToMusicScore 第三步内联处理
      xmlDataFor(partItem[partItemKey], (measureData) => {
        measureSwitch(measureData);
      });

      break;
    }
    case 'sound': {
      // <sound tempo="…"/> 写在 part 层级，对应 xmlToMusicScore 第二步的 bpm 读取
      musicScore.bpm = +partItem[partItemKey][0][':@']['@_tempo'];

      break;
    }
  }
}

/** 旧版 measure 子节点分发；note 分支主体逻辑已注释，见 xmlToMusicScore */
function measureSwitch(measureData) {
  const {key: measureItemKey, item: measureItem} = measureData;
  switch (measureItemKey) {
    case ':@': {
      // 这里的操作在外部提前执行了
      break;
    }
    case 'attributes': {
      // 调号/拍号/谱号/staves 解析已迁移至 xmlToMusicScore 第三步 attributes 分支
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

/** 旧版 attributes 子节点分发；各 case 内为历史 editor 插入逻辑，已注释 */
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
