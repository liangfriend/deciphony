import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  Chronaxie,
  ClefTypeEnum,
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    KeySignatureTypeEnum,
  Measure,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  MusicScore,
  NoteNumber,
  NoteSymbol,
  NoteSymbolTypeEnum,
  NotesInfo,
  StaffSlot
} from "deciphony-renderer";

/**
 * TODO 目前这个播放函数只针对五线谱
 * */
export type Unit256 = number; // 256=whole, 128=half, 64=quarter, 32=eighth, 16=sixteenth.
export type DR_playSequence_item = {
  note_id: string;
  midi: number;
  duration: Unit256;
  playTime: Unit256;
  /** 延音线（同音高 slur）时：首音=整段时值之和，其余=0；未设置则与 duration 同义 */
  real_duration?: Unit256;
}
export type DR_playSequence = Array<DR_playSequence_item>

enum EndAnchorEnum {
  Barline_final = 'barline_final',
  Fine_sign = 'fine_sign',
}

type MeasurePosition = {
  grandStaffIndex: number
  measureIndex: number
  measure: Measure
}

type VoltaInfo = {
  id: string
  startIndex: number
  endIndex: number
  value: number[]
}

type StaffPlayState = {
  /** 自最近一次 keySignature_f / keySignature_b / 音符级（无）起生效，直到下一处调号 */
  curKeySignature: KeySignatureTypeEnum
  /** 自最近一次 clef_f / clef_b / 音符·休止符 clef 起生效，直到下一处谱号 */
  curClef: ClefTypeEnum
}

/** 小节内变音号记忆：region → 已生效的变音（null=本小节曾出现还原号，该级自然） */
type MeasureAccidentalScope = Map<number, Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null>

type AlteredAccidental = Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural>

type RepeatState = {
  barLine: boolean
  dc: boolean
  dc_al_fine: boolean
  dc_al_coda: boolean
  ds: boolean
  ds_al_fine: boolean
  ds_al_coda: boolean
  segno: boolean
  coda: boolean
  toCoda: boolean
}
// 各谱号锚点：startRegion 对应某个 C（do），startMidi 为该 C 的 midi
const CLEF_ANCHOR: Record<ClefTypeEnum, { startRegion: number; startMidi: number }> = {
  [ClefTypeEnum.Treble]: {startRegion: -2, startMidi: 60}, // 第一线下方 C4
  [ClefTypeEnum.Bass]: {startRegion: -4, startMidi: 36},   // 第一线下方 C2
  [ClefTypeEnum.Alto]: {startRegion: -3, startMidi: 48},   // 第一线下方 C3
  [ClefTypeEnum.Tenor]: {startRegion: -1, startMidi: 48},  // 第一线下方 C3
}

// 以 C=do 为 0 的七个自然音级字母
const DIATONIC_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/**
 * 倚音播放时值：不占小节拍位，不累加 playTime；从主音时值中抢奏。
 * 曲谱里倚音的 chronaxie 多用于排版缩放，此处用固定短音长近似演奏。
 */
const GRACE_PLAY_DURATION: Unit256 = getDuration(16, 0)

/** slur 端点必须为 NotesInfo.id / NotesNumberInfo.id（倚音同结构） */
function isSlurNotesInfoEndpoint(musicScore: MusicScore, endpointId: string): boolean {
  for (const grandStaff of musicScore.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        for (const slot of measure.notes) {
          if (!('type' in slot)) {
            const note = slot as NoteNumber
            for (const ni of note.notesInfo) {
              if (ni.id === endpointId) return true
            }
            for (const ni of note.notesInfo) {
              for (const g of ni.graceNotes ?? []) {
                if (g.id === endpointId) return true
              }
              for (const g of ni.graceNotesAfter ?? []) {
                if (g.id === endpointId) return true
              }
            }
            continue
          }
          if (slot.type !== NoteSymbolTypeEnum.Note) continue
          for (const ni of slot.notesInfo) {
            if (ni.id === endpointId) return true
          }
          for (const g of slot.graceNotes ?? []) {
            if (g.id === endpointId) return true
          }
          for (const g of slot.graceNotesAfter ?? []) {
            if (g.id === endpointId) return true
          }
        }
      }
    }
  }
  return false
}

function findSeqItemBySlurEndpoint(
  seq: DR_playSequence,
  endpointId: string,
): DR_playSequence_item | undefined {
  if (!endpointId) return undefined
  return seq.find((it) => it.note_id === endpointId && it.midi > 0)
}

/**
 * 同音高 slur 视为延音线：段内首音 real_duration = Σduration，其余为 0。
 * 段内任一音 midi 不同则整段 slur 不当作延音线。
 */
function applySlurTieRealDuration(
  seq: DR_playSequence,
  musicScore: MusicScore,
  noteStaveIndex: Map<string, number>,
): void {
  for (const sym of musicScore.affiliatedSymbols ?? []) {
    if (sym.name !== DoubleNoteAffiliatedSymbolNameEnum.slur) continue
    if (!('startId' in sym) || !('endId' in sym)) continue

    if (!isSlurNotesInfoEndpoint(musicScore, sym.startId) || !isSlurNotesInfoEndpoint(musicScore, sym.endId)) {
      continue
    }
    const startItem = findSeqItemBySlurEndpoint(seq, sym.startId)
    const endItem = findSeqItemBySlurEndpoint(seq, sym.endId)
    if (!startItem || !endItem) continue

    const stave = noteStaveIndex.get(startItem.note_id)
    const endStave = noteStaveIndex.get(endItem.note_id)
    if (stave == null || stave !== endStave) continue

    const tMin = Math.min(startItem.playTime, endItem.playTime)
    const tMax = Math.max(startItem.playTime, endItem.playTime)

    const inSlur = seq
      .filter(
        (it) =>
          it.midi > 0 &&
          noteStaveIndex.get(it.note_id) === stave &&
          it.playTime >= tMin &&
          it.playTime <= tMax,
      )
      .sort((a, b) => a.playTime - b.playTime || a.note_id.localeCompare(b.note_id))

    if (inSlur.length < 2) continue

    const midis = new Set(inSlur.map((it) => it.midi))
    if (midis.size !== 1) continue

    const totalDuration = inSlur.reduce((sum, it) => sum + it.duration, 0)
    inSlur[0]!.real_duration = totalDuration
    for (let i = 1; i < inSlur.length; i++) {
      inSlur[i]!.real_duration = 0
    }
  }
}

/** clef + region → 自然音级（0=C,1=D,…6=B），region 是按线/间逐级递增的“级进”，7 级 = 1 个八度 */
function getDiatonicDegreeFromC(clef: ClefTypeEnum, region: number): number {
  const {startRegion} = CLEF_ANCHOR[clef]
  const steps = region - startRegion
  return ((steps % 7) + 7) % 7
}

/**
 * musicScore转可播放序列
 * - 复谱表（系统）在时间轴上顺序衔接；同一复谱表内各单谱表（声部）同时起奏
 * - 休止符也记录，midi = 0
 * - 变音号：作用域为当前小节、按 region（级进位置）；同 region 后续音继承，直至新的变音/还原
 * - 谱号：clef_f / 音符·休止符 clef / clef_b 依次生效，直到下一处谱号
 * - 调号：keySignature_f / keySignature_b 依次生效，直到下一处调号
 * - 谱号/调号状态按 staveIndex 跨复谱表延续（换行复谱表不回到 C 大调/高音谱号）
 * - 倚音：在主音拍位前/后抢奏，不推进小节时间轴（仅主音 chronaxie 计入 playTime）
 * - 同音高 slur → 延音线：首音 real_duration 为段内 duration 之和，其余为 0
 */
export function getDrPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  // 结束模式，结尾小节线结束|Fine符号结束  如果最后一小节没有任何反复符号了，肯定会结束
  let endAnchor = EndAnchorEnum.Barline_final as EndAnchorEnum
  // 当前volta轮次, 反复小节线反复后，轮次加1，不属于当前volta的小节不播放， 没有volta覆盖的小节肯定会播放
  let voltaRound = 0
  /**
   * 已激活符号id表,  所有触发一次的符号都要把id加入这个表中
   * volta优先级大于反复小节线但是小于repeatState，即使反复小节线被激活过了，但是有volta且volta.value包含voltaRound+1，则还是会触发反复小节线。前提是反复小节线状态还是激活的
   *
   */
  const actived = new Set<string>()
  /**
   *  已激活反复模式，只有被激活的反复模式可以反复
   *  触发barline反复时，其余状态不变。
   *  触发dc,dc、dc_al_fine、dc_al_code状态改为false(理论上不应该有多个dc),barline状态改为false
   *  触发dc_al_fine, fine激活，dc相关的全部false, barline改为false, endAnchor改为Fine
   *  触发dc_al_coda，coda激活，dc相关的全部false, barline改为false
   *  触发ds,segno激活，barline状态改为false
   *  触发ds_al_fine,segno激活, barline改为false, endAnchor改为Fine
   *  触发ds_al_coda,coda激活, barline改为false,
   *  触发segno, segno改为false
   *  触发coda, 激活toCoda, coda改为false
   */
  const reapeatState: RepeatState = {
    barLine: true,
    dc: true,
    dc_al_fine: true,
    dc_al_coda: true,
    ds: true,
    ds_al_fine: true,
    ds_al_coda: true,
    segno: false,
    coda: false,
    toCoda: false
  }
  //
  /**
   * 顺序获取所有小节的位置信息，相当于把曲谱按小节平铺了,但是只是第一行单谱表
   * 所以所有反复相关的符号，只有在第一行单谱表上才会生效。
   * 这个逻辑是正确的，否则会出现不同小节不同反复情况，无法正确生成播放序列
   */
  const measurePositions = getMeasurePositions(musicScoreData)
  // 永远忽快速查找索引
  const measureIndexMap = new Map(measurePositions.map((item, index) => [item.measure.id, index]))
  // volta开始和结束符号id存储
  const voltaByStartIndex = new Map<number, VoltaInfo>()
  const voltaByEndIndex = new Map<number, VoltaInfo>()
  for (const volta of getVoltaList(musicScoreData, measureIndexMap, measurePositions)) {
    voltaByStartIndex.set(volta.startIndex, volta)
    voltaByEndIndex.set(volta.endIndex, volta)
  }
  // 第一个segno
  const firstSegnoIndex = measurePositions.findIndex(({measure}) => measure.startRepeat?.type === MeasureStartRepeatEnum.Segno)
  // 第一个coda
  const firstCodaIndex = measurePositions.findIndex(({measure}) => measure.startRepeat?.type === MeasureStartRepeatEnum.Coda)
  // 待播放小节索引列表，直接通过这个生成播放序列
  const playMeasureIndexes: number[] = []
  // 指向当前操作的小节的指针
  let measureCursor = 0
  let currentRepeatStartIndex = 0
  // 记录当前循环次数
  let loopGuard = 0
  // 防止死循环
  const maxRepeatSteps = Math.max(measurePositions.length * 32, 256)

  while (measureCursor >= 0 && measureCursor < measurePositions.length && loopGuard < maxRepeatSteps) {
    // 循环次数加1
    loopGuard += 1
    // 如果小节有volta, 且不存在当前volta轮次，跳过
    const volta = voltaByStartIndex.get(measureCursor)
    if (volta && !volta.value.includes(voltaRound)) {
      measureCursor = volta.endIndex + 1
      continue
    }
    // 获取小节
    const measure = measurePositions[measureCursor].measure
    // 推入待播放小节索引列表
    playMeasureIndexes.push(measureCursor)
    // 标记当前小节索引为反复开始小节索引
    if (isStartRepeatBarline(measure.barline_f?.type)) {
      currentRepeatStartIndex = measureCursor
    }
    // 遇到segno和coda直接变成false
    if (measure.startRepeat?.type === MeasureStartRepeatEnum.Segno && reapeatState.segno) {
      reapeatState.segno = false
    }
    if (measure.startRepeat?.type === MeasureStartRepeatEnum.Coda && reapeatState.coda) {
      reapeatState.toCoda = true
      reapeatState.coda = false
    }
    // 如果当前停止模式是Fine且当前小节有FIne,跳出循环
    if (endAnchor === EndAnchorEnum.Fine_sign && measure.endRepeat?.type === MeasureEndRepeatEnum.Fine) {
      break
    }
    // 判断小节的endRepeat是否生效，执行反复
    const jumpIndex = getRepeatJumpIndex(
      measure,
      measureCursor,
      currentRepeatStartIndex,
      firstSegnoIndex,
      firstCodaIndex,
      voltaByEndIndex.get(measureCursor)?.value.includes(voltaRound) ?? false,
      actived,
      reapeatState,
      () => {
        endAnchor = EndAnchorEnum.Fine_sign
      },
      () => {
        voltaRound += 1
      },
    )
    // 存在跳转索引，跳转
    if (jumpIndex != null) {
      measureCursor = jumpIndex
      continue
    }
    // 如果当前停止模式是Final_barline且当前小节有Final_barline,跳出循环
    if (measure.barline_b?.type === BarlineTypeEnum.Final_barline && endAnchor === EndAnchorEnum.Barline_final) {
      break
    }
    measureCursor += 1
  }

  const seq: DR_playSequence = []
  const noteStaveIndex = new Map<string, number>()
  /*
   * 谱号/调号按「单谱表行号 staveIndex」在全曲延续，不按复谱表重置。
   * 下一行复谱表同序号单谱表若小节无 clef_f/keySignature_f，继承上一行同序号声部结束时的状态。
   */
  const maxStaves = Math.max(0, ...musicScoreData.grandStaffs.map((gs) => gs.staves.length))
  const staffStates: StaffPlayState[] = Array.from({length: maxStaves}, () => ({
    curKeySignature: KeySignatureTypeEnum.C,
    curClef: ClefTypeEnum.Treble,
  }))
  let globalPlayTime: Unit256 = 0

  for (const measureIndex of playMeasureIndexes) {
    const {grandStaffIndex, measureIndex: measureInGrandStaffIndex} = measurePositions[measureIndex]
    const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
    let measureDuration: Unit256 = 0
    for (let staveIndex = 0; staveIndex < grandStaff.staves.length; staveIndex++) {
      const measure = grandStaff.staves[staveIndex].measures[measureInGrandStaffIndex]
      if (!measure) continue
      // 按小节为单位操作符号
      const staveDuration = appendMeasureSequence(
        seq,
        measure,
        globalPlayTime,
        staffStates[staveIndex],
        staveIndex,
        noteStaveIndex,
      )
      measureDuration = Math.max(measureDuration, staveDuration)
    }
    globalPlayTime += measureDuration
  }

  applySlurTieRealDuration(seq, musicScoreData, noteStaveIndex)
  return seq.sort((a, b) => a.playTime - b.playTime)
}

function applyMeasureKeySignatureFront(state: StaffPlayState, measure: Measure): void {
  if (measure.keySignature_f) {
    state.curKeySignature = measure.keySignature_f.type
  }
}

function applyMeasureClefFront(state: StaffPlayState, measure: Measure): void {
  if (measure.clef_f) {
    state.curClef = measure.clef_f.type
  }
}

function applyMeasureKeySignatureBack(state: StaffPlayState, measure: Measure): void {
  if (measure.keySignature_b) {
    state.curKeySignature = measure.keySignature_b.type
  }
}

function applyMeasureClefBack(state: StaffPlayState, measure: Measure): void {
  if (measure.clef_b) {
    state.curClef = measure.clef_b.type
  }
}

function applySlotClef(state: StaffPlayState, clef: { type: ClefTypeEnum } | undefined): void {
  if (clef) {
    state.curClef = clef.type
  }
}

/** 读取 region 上的有效变音，并更新小节作用域 */
function resolveAccidentalInMeasure(
  explicitType: AccidentalTypeEnum | undefined,
  scope: MeasureAccidentalScope,
  clef: ClefTypeEnum,
  keySignature: KeySignatureTypeEnum,
  region: number,
): AlteredAccidental | null {
  if (explicitType != null) {
    if (explicitType === AccidentalTypeEnum.Natural) {
      scope.set(region, null)
      return null
    }
    const altered = explicitType as AlteredAccidental
    // 将音符变音符号加入小节作用域
    scope.set(region, altered)
    return altered
  }
  if (scope.has(region)) {
    return scope.get(region) ?? null
  }
  return getKeySignatureAccidental(clef, keySignature, region)
}

function pushPitchItem(
  seq: DR_playSequence,
  noteStaveIndex: Map<string, number>,
  staveIndex: number,
  item: DR_playSequence_item,
): void {
  seq.push(item)
  if (item.midi > 0) {
    noteStaveIndex.set(item.note_id, staveIndex)
  }
}

function appendNotesInfoChord(
  seq: DR_playSequence,
  notesInfo: NotesInfo[],
  playTime: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  const lead = notesInfo[0]
  const duration = lead ? getDuration(lead.chronaxie, lead.augmentationDot?.count ?? 0) : 0
  for (const noteInfo of notesInfo) {
    const accidental = resolveAccidentalInMeasure(
      noteInfo.accidental?.type,
      scope,
      state.curClef,
      state.curKeySignature,
      noteInfo.region,
    )
    const midi = getNoteMidi(state.curClef, noteInfo.region, accidental)
    pushPitchItem(seq, noteStaveIndex, staveIndex, {note_id: noteInfo.id, midi, duration, playTime})
  }
  return duration
}

function pushGraceNote(
  seq: DR_playSequence,
  g: NotesInfo,
  at: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const accidental = resolveAccidentalInMeasure(
    g.accidental?.type,
    scope,
    state.curClef,
    state.curKeySignature,
    g.region,
  )
  const midi = getNoteMidi(state.curClef, g.region, accidental)
  pushPitchItem(seq, noteStaveIndex, staveIndex, {
    note_id: g.id,
    midi,
    duration: GRACE_PLAY_DURATION,
    playTime: at,
  })
}

/** 前倚音：紧挨主音拍位之前抢奏，不推迟主音 playTime */
function appendGraceNotesBefore(
  seq: DR_playSequence,
  graceNotes: NotesInfo[] | undefined,
  mainPlayTime: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  if (!list.length) return
  let t = mainPlayTime - list.length * GRACE_PLAY_DURATION
  for (const g of list) {
    pushGraceNote(seq, g, t, state, scope, staveIndex, noteStaveIndex)
    t += GRACE_PLAY_DURATION
  }
}

/** 后倚音：从主音尾部抢奏，不延长小节拍长 */
function appendGraceNotesAfter(
  seq: DR_playSequence,
  graceNotes: NotesInfo[] | undefined,
  mainPlayTime: Unit256,
  mainDuration: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  if (!list.length) return
  const steal = Math.min(mainDuration, list.length * GRACE_PLAY_DURATION)
  let t = mainPlayTime + mainDuration - steal
  for (const g of list) {
    pushGraceNote(seq, g, t, state, scope, staveIndex, noteStaveIndex)
    t += GRACE_PLAY_DURATION
  }
}

function appendNoteSymbolSequence(
  seq: DR_playSequence,
  note: NoteSymbol,
  playTime: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  applySlotClef(state, note.clef)
  appendGraceNotesBefore(seq, note.graceNotes, playTime, state, scope, staveIndex, noteStaveIndex)
  const chordDuration = appendNotesInfoChord(
    seq,
    note.notesInfo,
    playTime,
    state,
    scope,
    staveIndex,
    noteStaveIndex,
  )
  appendGraceNotesAfter(
    seq,
    note.graceNotesAfter,
    playTime,
    chordDuration,
    state,
    scope,
    staveIndex,
    noteStaveIndex,
  )
  return playTime + chordDuration
}

function appendMeasureSequence(
  seq: DR_playSequence,
  measure: Measure,
  measureStart: Unit256,
  state: StaffPlayState,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  // 记录小节作用域的变音符号
  const measureAccidentals: MeasureAccidentalScope = new Map()
  // 应用小节前谱号前调号（由音符产生的）
  applyMeasureKeySignatureFront(state, measure)
  applyMeasureClefFront(state, measure)

  let playTime = measureStart
  // 对音符slot进行操作
  for (const slot of measure.notes) {
    const s = slot as StaffSlot
    if (s.type === NoteSymbolTypeEnum.Rest) {
      applySlotClef(state, s.clef)
      const duration = getDuration(s.chronaxie, s.augmentationDot?.count ?? 0)
      seq.push({note_id: s.id, midi: 0, duration, playTime})
      playTime += duration
        } else if (s.type === NoteSymbolTypeEnum.Note) {
            playTime = appendNoteSymbolSequence(
                seq,
                s,
                playTime,
                state,
                measureAccidentals,
                staveIndex,
                noteStaveIndex,
            )
        }
    }
  // 小节结束前再应用一下后置谱号调号
  applyMeasureClefBack(state, measure)
  applyMeasureKeySignatureBack(state, measure)
  return playTime - measureStart
}

function getMeasurePositions(musicScoreData: MusicScore): MeasurePosition[] {
  const positions: MeasurePosition[] = []
  for (let grandStaffIndex = 0; grandStaffIndex < musicScoreData.grandStaffs.length; grandStaffIndex++) {
    const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
    const conductorStave = grandStaff.staves[0]
    if (!conductorStave) continue
    for (let measureIndex = 0; measureIndex < conductorStave.measures.length; measureIndex++) {
      positions.push({
        grandStaffIndex,
        measureIndex,
        measure: conductorStave.measures[measureIndex],
      })
    }
  }
  return positions
}

function getVoltaList(
  musicScoreData: MusicScore,
  measureIndexMap: Map<string, number>,
  measurePositions: MeasurePosition[],
): VoltaInfo[] {
  return musicScoreData.affiliatedSymbols
  .flatMap(symbol => {
    if (symbol.name !== DoubleMeasureAffiliatedSymbolNameEnum.volta || !('volta' in symbol.data) || !symbol.data.volta) {
      return []
    }
    const startIndex = measureIndexMap.get(symbol.startId)
    const endIndex = measureIndexMap.get(symbol.endId)
    if (startIndex == null || endIndex == null) return []
    const endMeasure = measurePositions[endIndex]?.measure
    if (!isEndRepeatBarline(endMeasure?.barline_b?.type)) return []
    return [{
      id: symbol.id,
      startIndex,
      endIndex,
      value: symbol.data.volta.value,
    }]
  })
}

function getRepeatJumpIndex(
  measure: Measure,
  measureIndex: number,
  currentRepeatStartIndex: number,
  firstSegnoIndex: number,
  firstCodaIndex: number,
  isCurrentVoltaRoundEnd: boolean,
  actived: Set<string>,
  reapeatState: RepeatState,
  activateFine: () => void,
  increaseVoltaRound: () => void,
): number | null {
  const endRepeat = measure.endRepeat
  if (endRepeat) {
    switch (endRepeat.type) {
      case MeasureEndRepeatEnum.To_coda:
        if ((reapeatState.toCoda || reapeatState.coda) && firstCodaIndex >= 0) {
          reapeatState.toCoda = false
          reapeatState.coda = false
          actived.add(endRepeat.id)
          return firstCodaIndex
        }
        break
      case MeasureEndRepeatEnum.DC:
        if (reapeatState.dc && !actived.has(endRepeat.id)) {
          disableDcState(reapeatState)
          reapeatState.barLine = false
          actived.add(endRepeat.id)
          return 0
        }
        break
      case MeasureEndRepeatEnum.DC_al_fine:
        if (reapeatState.dc_al_fine && !actived.has(endRepeat.id)) {
          disableDcState(reapeatState)
          reapeatState.barLine = false
          activateFine()
          actived.add(endRepeat.id)
          return 0
        }
        break
      case MeasureEndRepeatEnum.DC_al_coda:
        if (reapeatState.dc_al_coda && !actived.has(endRepeat.id)) {
          disableDcState(reapeatState)
          reapeatState.barLine = false
          reapeatState.coda = true
          actived.add(endRepeat.id)
          return 0
        }
        break
      case MeasureEndRepeatEnum.DS:
        if (reapeatState.ds && !actived.has(endRepeat.id) && firstSegnoIndex >= 0) {
          reapeatState.ds = false
          reapeatState.barLine = false
          reapeatState.segno = true
          actived.add(endRepeat.id)
          return firstSegnoIndex
        }
        break
      case MeasureEndRepeatEnum.DS_al_fine:
        if (reapeatState.ds_al_fine && !actived.has(endRepeat.id) && firstSegnoIndex >= 0) {
          reapeatState.ds_al_fine = false
          reapeatState.barLine = false
          reapeatState.segno = true
          activateFine()
          actived.add(endRepeat.id)
          return firstSegnoIndex
        }
        break
      case MeasureEndRepeatEnum.DS_al_coda:
        if (reapeatState.ds_al_coda && !actived.has(endRepeat.id) && firstSegnoIndex >= 0) {
          reapeatState.ds_al_coda = false
          reapeatState.barLine = false
          reapeatState.segno = true
          reapeatState.coda = true
          actived.add(endRepeat.id)
          return firstSegnoIndex
        }
        break
    }
  }

  if (reapeatState.barLine && isEndRepeatBarline(measure.barline_b?.type)) {
    const barlineId = measure.barline_b?.id ?? `barline:${measureIndex}`
    if (!actived.has(barlineId) || isCurrentVoltaRoundEnd) {
      actived.add(barlineId)
      increaseVoltaRound()
      return currentRepeatStartIndex
    }
  }

  return null
}

function disableDcState(reapeatState: RepeatState): void {
  reapeatState.dc = false
  reapeatState.dc_al_fine = false
  reapeatState.dc_al_coda = false
}

function isStartRepeatBarline(type: BarlineTypeEnum | undefined): boolean {
  return type === BarlineTypeEnum.StartRepeat_barline || type === BarlineTypeEnum.Start_end_repeat_barline
}

function isEndRepeatBarline(type: BarlineTypeEnum | undefined): boolean {
  return type === BarlineTypeEnum.EndRepeat_barline || type === BarlineTypeEnum.Start_end_repeat_barline
}

function getDuration(chronaxie: Chronaxie, dotCount: number): Unit256 {
  let total: number = chronaxie
  let add: number = chronaxie
  for (let i = 0; i < dotCount; i++) {
    add = add / 2
    total += add
  }
  return total
}

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const

const KEY_ALTERATION: Record<KeySignatureTypeEnum, { kind: 'sharp' | 'flat'; count: number }> = {
  [KeySignatureTypeEnum.C]: {kind: 'sharp', count: 0},
  [KeySignatureTypeEnum.G]: {kind: 'sharp', count: 1},
  [KeySignatureTypeEnum.D]: {kind: 'sharp', count: 2},
  [KeySignatureTypeEnum.A]: {kind: 'sharp', count: 3},
  [KeySignatureTypeEnum.E]: {kind: 'sharp', count: 4},
  [KeySignatureTypeEnum.B]: {kind: 'sharp', count: 5},
  [KeySignatureTypeEnum.F_sharp]: {kind: 'sharp', count: 6},
  [KeySignatureTypeEnum.C_sharp]: {kind: 'sharp', count: 7},
  [KeySignatureTypeEnum.F]: {kind: 'flat', count: 1},
  [KeySignatureTypeEnum.B_flat]: {kind: 'flat', count: 2},
  [KeySignatureTypeEnum.E_flat]: {kind: 'flat', count: 3},
  [KeySignatureTypeEnum.A_flat]: {kind: 'flat', count: 4},
  [KeySignatureTypeEnum.D_flat]: {kind: 'flat', count: 5},
  [KeySignatureTypeEnum.G_flat]: {kind: 'flat', count: 6},
  [KeySignatureTypeEnum.C_flat]: {kind: 'flat', count: 7},
}

export function getKeySignatureAccidental(
  clef: ClefTypeEnum,
  keySignature: KeySignatureTypeEnum,
  region: number,
): Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null {
  const alteration = KEY_ALTERATION[keySignature]
  if (!alteration || alteration.count === 0) return null
  const letter = DIATONIC_LETTERS[getDiatonicDegreeFromC(clef, region)]
  const order = alteration.kind === 'sharp' ? SHARP_ORDER : FLAT_ORDER
  const altered = order.slice(0, alteration.count) as readonly string[]
  if (!altered.includes(letter)) return null
  return alteration.kind === 'sharp' ? AccidentalTypeEnum.Sharp : AccidentalTypeEnum.Flat
}

function getNoteMidi(clef: ClefTypeEnum, region: number, accidental: Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null = null): number {
  const rule = [0, 2, 4, 5, 7, 9, 11]
  const acc_offset_map: Record<Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural>, number> = {
    [AccidentalTypeEnum.Flat]: -1,
    [AccidentalTypeEnum.Sharp]: 1,
    [AccidentalTypeEnum.Double_flat]: -2,
    [AccidentalTypeEnum.Double_sharp]: 2,
  }
  const {startRegion, startMidi} = CLEF_ANCHOR[clef]
  const steps = region - startRegion
  const multiple = Math.floor(steps / 7)
  const remain = ((steps % 7) + 7) % 7
  const accOffset = accidental ? acc_offset_map[accidental] : 0
  return multiple * 12 + rule[remain] + accOffset + startMidi
}
