import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  DoubleMeasureAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  Measure,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  TimeSignatureTypeEnum,
  NotesInfo,
  NoteSymbolTypeEnum,
  StaffSlot,
  MusicScore,
} from 'deciphony-renderer'
import {createAccidental} from './dr-edit/score-builder'

/**
 * 乐理基础工具（与播放无关）：region ↔ midi 换算、调号变音、谱号锚点等。
 * play-util 等具体业务从此处复用，避免重复定义。
 */

/** 非还原变音号（升/降/重升/重降） */
export type AlteredAccidental = Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural>

/** 自然音级（C..B）相对八度起点 C 的半音偏移 */
export const DIATONIC_SEMITONES = [0, 2, 4, 5, 7, 9, 11]

/** 以 C=do 为 0 的七个自然音级字母 */
export const DIATONIC_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/** 各谱号第一线下方锚点：startRegion 对应某个 C(do)，startMidi 为该 C 的 midi */
export const CLEF_ANCHOR: Record<ClefTypeEnum, { startRegion: number; startMidi: number }> = {
  [ClefTypeEnum.Treble]: {startRegion: -2, startMidi: 60}, // 第一线下方 C4
  [ClefTypeEnum.Bass]: {startRegion: -4, startMidi: 36},   // 第一线下方 C2
  [ClefTypeEnum.Alto]: {startRegion: -3, startMidi: 48},   // 第一线下方 C3
  [ClefTypeEnum.Tenor]: {startRegion: -1, startMidi: 48},  // 第一线下方 C3
}

export const ACC_OFFSET_MAP: Record<AlteredAccidental, number> = {
  [AccidentalTypeEnum.Flat]: -1,
  [AccidentalTypeEnum.Sharp]: 1,
  [AccidentalTypeEnum.Double_flat]: -2,
  [AccidentalTypeEnum.Double_sharp]: 2,
}

/** 升号调依次升的音级顺序（F C G D A E B） */
export const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
/** 降号调依次降的音级顺序（B E A D G C F） */
export const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const

/** 各调号的升降种类与数量 */
export const KEY_ALTERATION: Record<KeySignatureTypeEnum, { kind: 'sharp' | 'flat'; count: number }> = {
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

/** clef + region → 自然音级（0=C,1=D,…6=B）。region 按线/间逐级递增，7 级 = 1 个八度 */
export function getDiatonicDegreeFromC(clef: ClefTypeEnum, region: number): number {
  const {startRegion} = CLEF_ANCHOR[clef]
  const steps = region - startRegion
  return ((steps % 7) + 7) % 7
}

/** 调号在指定 region 上引入的默认变音（无则 null） */
export function getKeySignatureAccidental(
  clef: ClefTypeEnum,
  keySignature: KeySignatureTypeEnum,
  region: number,
): AlteredAccidental | null {
  const alteration = KEY_ALTERATION[keySignature]
  if (!alteration || alteration.count === 0) return null
  const letter = DIATONIC_LETTERS[getDiatonicDegreeFromC(clef, region)]
  const order = alteration.kind === 'sharp' ? SHARP_ORDER : FLAT_ORDER
  const altered = order.slice(0, alteration.count) as readonly string[]
  if (!altered.includes(letter)) return null
  return alteration.kind === 'sharp' ? AccidentalTypeEnum.Sharp : AccidentalTypeEnum.Flat
}

/** clef + region + accidental → midi（getNoteRegion 的反向） */
export function getNoteMidi(
  clef: ClefTypeEnum,
  region: number,
  accidental: AlteredAccidental | null = null,
): number {
  const {startRegion, startMidi} = CLEF_ANCHOR[clef]
  const steps = region - startRegion
  const multiple = Math.floor(steps / 7)
  const remain = ((steps % 7) + 7) % 7
  const accOffset = accidental ? ACC_OFFSET_MAP[accidental] : 0
  return multiple * 12 + DIATONIC_SEMITONES[remain]! + accOffset + startMidi
}

/**
 * 传入 midi、clef、accidental，返回 region（getNoteMidi 的反向）。
 *
 * 先扣除变音记号偏移得到自然音 midi，再按谱号锚点换算出五线谱位置 region。
 * 若扣除变音后不是自然音级（落在黑键上），说明 accidental 与 midi 不自洽，返回 null。
 */
export function getNoteRegion(
  clef: ClefTypeEnum,
  midi: number,
  accidental: Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null = null,
): number | null {
  const {startRegion, startMidi} = CLEF_ANCHOR[clef]
  const accOffset = accidental ? ACC_OFFSET_MAP[accidental] : 0
  // 自然音相对锚点 C 的半音数
  const baseMidi = midi - accOffset - startMidi
  const octave = Math.floor(baseMidi / 12)
  const semitone = baseMidi - octave * 12
  const remain = DIATONIC_SEMITONES.indexOf(semitone)
  if (remain < 0) return null
  return startRegion + octave * 7 + remain
}

/**
 * 传入 clef、midi、priority，返回 region 与 accidental。
 *
 * 自然音直接返回（accidental 为 null）；黑键音按 priority 选择升/降记号：
 * - priority = Sharp：记为「下方自然音 + 升号」
 * - priority = Flat：记为「上方自然音 + 降号」
 */
export function getNoteRegionAndAccidental(
  clef: ClefTypeEnum,
  midi: number,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat = AccidentalTypeEnum.Sharp,
): { region: number; accidental: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat | null } {
  const naturalRegion = getNoteRegion(clef, midi, null)
  if (naturalRegion !== null) {
    return {region: naturalRegion, accidental: null}
  }
  // 黑键：扣除 priority 偏移后即为对应自然音位置
  const region = getNoteRegion(clef, midi, priority)!
  return {region, accidental: priority}
}

/**
 * 小节音符变调函数
 * 传入小节, 当前调号，目标调号，返回音符变调后的小节（原地修改）
 * 目的是实现变调号后每个音符 midi 含义不变（音高不变，只改变音记号）。
 *
 * 注意：这个函数不会改变小节的调号也不会读取小节的调号，完全根据传入的当前调号和目标调号来计算。
 * clef 不属于调号，但决定 region 对应的音名，因此从 measure.clef_f / 音符级 clef 推导（默认高音谱号）。
 *
 * 变音符号陷阱：同一小节内，前方音符的显式变音符号会延续到该小节后续同 region 的音符。
 * 因此读取旧调号下的实际音高、写入新调号下的记号时，都要按出现顺序维护“小节内 region 作用域”。
 *
 * 处理策略（保持音高不变）：
 * - 显式升/降（含重升降）：是真实的临时变化音，保留不动。
 * - 显式还原号 / 无记号：按需重算——可能新增（补旧调号记号或还原号），
 *   也可能去掉已不再需要的还原号（如变到 C 调后该还原号多余）。
 */
export function changeMeasureNotesKeySignature(
  measure: Measure,
  curKeySignature: KeySignatureTypeEnum,
  targetKeySignature: KeySignatureTypeEnum,
): Measure {
  if (curKeySignature === targetKeySignature) return measure

  let currentClef = measure.clef_f?.type ?? ClefTypeEnum.Treble
  /** region → 旧调号读谱时的实际变音（null=自然/还原） */
  const oldScope = new Map<number, AlteredAccidental | null>()
  /** region → 新调号写谱后实际生效的变音（null=自然/还原） */
  const newScope = new Map<number, AlteredAccidental | null>()

  const transformInfo = (info: NotesInfo) => {
    const region = info.region
    const explicit = info.accidental?.type

    // 1) 旧调号下该音符的实际音高变音（兼顾小节作用域）
    let oldEffective: AlteredAccidental | null
    if (explicit != null) {
      oldEffective = explicit === AccidentalTypeEnum.Natural ? null : (explicit as AlteredAccidental)
      oldScope.set(region, oldEffective)
    } else if (oldScope.has(region)) {
      oldEffective = oldScope.get(region) ?? null
    } else {
      oldEffective = getKeySignatureAccidental(currentClef, curKeySignature, region)
    }

    // 2) 显式升/降号：真实变化音，保留不动；同步新作用域
    if (explicit != null && explicit !== AccidentalTypeEnum.Natural) {
      newScope.set(region, oldEffective)
      return
    }

    // 3) 还原号 / 无记号：在新调号下写出能保持音高的「最简记号」
    const newImplied = newScope.has(region)
      ? (newScope.get(region) ?? null)
      : getKeySignatureAccidental(currentClef, targetKeySignature, region)

    if (newImplied === oldEffective) {
      // 新调号默认/作用域已等价 → 去掉多余记号（修复：变到 C 调后多余的还原号）
      if (info.accidental) delete info.accidental
    } else {
      // oldEffective 为 null → 需还原号；否则补旧调号的升/降号
      const writeType: AccidentalTypeEnum = oldEffective ?? AccidentalTypeEnum.Natural
      if (info.accidental) info.accidental.type = writeType
      else info.accidental = createAccidental(writeType)
      newScope.set(region, oldEffective)
    }
  }

  for (const slot of measure.notes) {
    const s = slot as StaffSlot
    // 音符 / 休止符上的 clef 会改变后续音名解析
    if (s.clef) currentClef = s.clef.type
    if (s.type !== NoteSymbolTypeEnum.Note) continue
    // 与播放顺序一致：前倚音 → 主音和弦 → 后倚音，共享小节作用域
    for (const g of s.graceNotes ?? []) transformInfo(g)
    for (const ni of s.notesInfo) transformInfo(ni)
    for (const g of s.graceNotesAfter ?? []) transformInfo(g)
  }

  return measure
}

enum EndAnchorEnum {
  Barline_final = 'barline_final',
  Fine_sign = 'fine_sign',
}

export type MeasurePosition = {
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

export function getMeasurePositions(musicScoreData: MusicScore): MeasurePosition[] {
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
  .flatMap((symbol) => {
    if (
      symbol.name !== DoubleMeasureAffiliatedSymbolNameEnum.Volta
      || !('volta' in symbol.data)
      || !symbol.data.volta
    ) {
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

function disableDcState(reapeatState: RepeatState): void {
  reapeatState.dc = false
  reapeatState.dc_al_fine = false
  reapeatState.dc_al_coda = false
}

function isStartRepeatBarline(type: BarlineTypeEnum | undefined): boolean {
  return type === BarlineTypeEnum.StartRepeat_barline
    || type === BarlineTypeEnum.Start_end_repeat_barline
}

function isEndRepeatBarline(type: BarlineTypeEnum | undefined): boolean {
  return type === BarlineTypeEnum.EndRepeat_barline
    || type === BarlineTypeEnum.Start_end_repeat_barline
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

export function getPlayMeasureIndexes(musicScoreData: MusicScore): number[] {
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
    toCoda: false,
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
  const firstSegnoIndex = measurePositions.findIndex(
    ({measure}) => measure.startRepeat?.type === MeasureStartRepeatEnum.Segno,
  )
  // 第一个coda
  const firstCodaIndex = measurePositions.findIndex(
    ({measure}) => measure.startRepeat?.type === MeasureStartRepeatEnum.Coda,
  )
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

  return playMeasureIndexes
}

/** 去掉与上一保留值相同的前置谱号/调号/拍号（连续重复只保留第一次） */
function dedupeMeasureFrontSymbols(measures: Measure[]) {
  let prevClef: ClefTypeEnum | undefined
  let prevKey: KeySignatureTypeEnum | undefined
  let prevTime: TimeSignatureTypeEnum | undefined

  for (const measure of measures) {
    if (measure.clef_f) {
      if (measure.clef_f.type === prevClef) delete measure.clef_f
      else prevClef = measure.clef_f.type
    }
    if (measure.keySignature_f) {
      if (measure.keySignature_f.type === prevKey) delete measure.keySignature_f
      else prevKey = measure.keySignature_f.type
    }
    if (measure.timeSignature_f) {
      if (measure.timeSignature_f.type === prevTime) delete measure.timeSignature_f
      else prevTime = measure.timeSignature_f.type
    }
  }
}

function cloneMeasure(measure: Measure): Measure {
  return JSON.parse(JSON.stringify(measure)) as Measure
}

function stripMeasureRepeatSymbols(measure: Measure): void {
  delete measure.startRepeat
  delete measure.endRepeat

  if (measure.barline_f) {
    const type = measure.barline_f.type
    if (
      type === BarlineTypeEnum.StartRepeat_barline
      || type === BarlineTypeEnum.Start_end_repeat_barline
    ) {
      delete measure.barline_f
    }
  }
  if (measure.barline_b) {
    const type = measure.barline_b.type
    if (
      type === BarlineTypeEnum.EndRepeat_barline
      || type === BarlineTypeEnum.Start_end_repeat_barline
    ) {
      measure.barline_b.type = BarlineTypeEnum.Single_barline
    }
  }
}

function removeVoltaAffiliatedSymbols(musicScore: MusicScore): void {
  musicScore.affiliatedSymbols = musicScore.affiliatedSymbols.filter(
    (sym) => sym.name !== DoubleMeasureAffiliatedSymbolNameEnum.Volta,
  )
}

function expandMeasuresByPlayIndexes(
  sourceMeasures: Measure[],
  playMeasureIndexes: number[],
): Measure[] {
  return playMeasureIndexes.map((sourceIndex, expandedIndex) => {
    const measure = cloneMeasure(sourceMeasures[sourceIndex]!)
    stripMeasureRepeatSymbols(measure)
    if (
      expandedIndex < playMeasureIndexes.length - 1
      && measure.barline_b?.type === BarlineTypeEnum.Final_barline
    ) {
      measure.barline_b.type = BarlineTypeEnum.Single_barline
    }
    return measure
  })
}

/**
 * 曲谱转换为单个复谱表模式
 */
export function mergeGrandStaff(musicScore: MusicScore): MusicScore {
  if (musicScore.grandStaffs.length === 0) return musicScore

  const staffCounts = musicScore.grandStaffs.map((gs) => gs.staves.length)
  const expectedCount = staffCounts[0]!
  if (staffCounts.some((count) => count !== expectedCount)) {
    throw new Error('单谱表数量不一致，无法转换')
  }

  const mergedGrandStaff = musicScore.grandStaffs[0]!
  for (let staffIndex = 0; staffIndex < expectedCount; staffIndex++) {
    const measures: Measure[] = []
    for (const grandStaff of musicScore.grandStaffs) {
      measures.push(...grandStaff.staves[staffIndex]!.measures)
    }
    mergedGrandStaff.staves[staffIndex]!.measures = measures
  }

  musicScore.grandStaffs = [mergedGrandStaff]

  const playMeasureIndexes = getPlayMeasureIndexes(musicScore)
  for (let staffIndex = 0; staffIndex < expectedCount; staffIndex++) {
    const sourceMeasures = mergedGrandStaff.staves[staffIndex]!.measures
    const expanded = expandMeasuresByPlayIndexes(sourceMeasures, playMeasureIndexes)
    mergedGrandStaff.staves[staffIndex]!.measures = expanded
    dedupeMeasureFrontSymbols(expanded)
  }

  removeVoltaAffiliatedSymbols(musicScore)
  return musicScore
}
