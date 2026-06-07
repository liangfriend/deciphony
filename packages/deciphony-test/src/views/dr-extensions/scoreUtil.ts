import {
    AccidentalTypeEnum,
    ClefTypeEnum,
    KeySignatureTypeEnum,
    Measure,
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
        dedupeMeasureFrontSymbols(measures)
    }

    musicScore.grandStaffs = [mergedGrandStaff]
    return musicScore
}