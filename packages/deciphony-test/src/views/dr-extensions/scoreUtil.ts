import {
    AccidentalTypeEnum,
    BarlineTypeEnum,
    ClefTypeEnum,
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    GrandStaff,
    KeySignatureTypeEnum,
    Measure,
    MeasureEndRepeatEnum,
    MeasureStartRepeatEnum,
    MusicScore,
    NoteNumber,
    NotesInfo,
    NotesNumberInfo,
    NoteSymbolTypeEnum,
    StaffSlot,
    TimeSignatureTypeEnum
} from 'deciphony-renderer'
import {createAccidental, newId} from './dr-edit/score-builder'

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
    [ClefTypeEnum.Bass]: {startRegion: -4, startMidi: 36}, // 第一线下方 C2
    [ClefTypeEnum.Alto]: {startRegion: -3, startMidi: 48}, // 第一线下方 C3
    [ClefTypeEnum.Tenor]: {startRegion: -1, startMidi: 48} // 第一线下方 C3
}

export const ACC_OFFSET_MAP: Record<AlteredAccidental, number> = {
    [AccidentalTypeEnum.Flat]: -1,
    [AccidentalTypeEnum.Sharp]: 1,
    [AccidentalTypeEnum.Double_flat]: -2,
    [AccidentalTypeEnum.Double_sharp]: 2
}

/** 升号调依次升的音级顺序（F C G D A E B） */
export const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
/** 降号调依次降的音级顺序（B E A D G C F） */
export const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const

/** 各调号的升降种类与数量 */
export const KEY_ALTERATION: Record<
    KeySignatureTypeEnum,
    { kind: 'sharp' | 'flat'; count: number }
> = {
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
    [KeySignatureTypeEnum.C_flat]: {kind: 'flat', count: 7}
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
    region: number
): AlteredAccidental | null {
    const alteration = KEY_ALTERATION[keySignature]
    if (!alteration || alteration.count === 0) return null
    const letter = DIATONIC_LETTERS[getDiatonicDegreeFromC(clef, region)]
    const order = alteration.kind === 'sharp' ? SHARP_ORDER : FLAT_ORDER
    const altered = order.slice(0, alteration.count) as readonly string[]
    if (!altered.includes(letter)) return null
    return alteration.kind === 'sharp' ? AccidentalTypeEnum.Sharp : AccidentalTypeEnum.Flat
}

/** clef + region + accidental → midi（getNoteRegion 的反向）
 * 注意这里的accidental别忘了考虑调号上的或者前方音符的accidental
 * */
export function getNoteMidi(
    clef: ClefTypeEnum,
    region: number,
    accidental: AlteredAccidental | null = null
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
 * 因为不完整，不对外使用，只是getNoteRegionAndAccidental的工具函数
 * TODO 这个不应该是函数了。应该合并到getNoteRegionAndAccidental
 */
function getNoteRegion(
    clef: ClefTypeEnum,
    midi: number,
    accidental: Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null = null
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

/** 谱面记号 → 有效变音（与 play-util resolveAccidentalInMeasure 一致） */
function effectiveFromWritten(
    written: AccidentalTypeEnum | null,
    keySigAcc: AlteredAccidental | null
): AlteredAccidental | null {
    if (written === null) return keySigAcc
    if (written === AccidentalTypeEnum.Natural) return null
    return written as AlteredAccidental
}

/** 在已知目标有效变音与调号默认变音时，选出最简谱面记号 */
function resolveMinimalWritten(
    needed: AlteredAccidental | null,
    keySigAcc: AlteredAccidental | null
): AccidentalTypeEnum | null {
    const options: (AccidentalTypeEnum | null)[] = [
        null,
        AccidentalTypeEnum.Natural,
        AccidentalTypeEnum.Sharp,
        AccidentalTypeEnum.Flat,
        AccidentalTypeEnum.Double_sharp,
        AccidentalTypeEnum.Double_flat
    ]
    for (const written of options) {
        if (effectiveFromWritten(written, keySigAcc) === needed) return written
    }
    return null
}

/**
 * 传入 clef、midi、调号，返回 region 与谱面显式变音记号。
 *
 * 与 getNoteMidi + getKeySignatureAccidental 对称：先枚举候选拼写，再用调号折算最简记号。
 * - 白键：调号已覆盖则 accidental 为 null；与调号冲突时写还原号
 * - 黑键：升/降两种拼写，优先无记号，其次与调号色彩一致，最后用 priority 打破平局
 */
export function getNoteRegionAndAccidental(
    clef: ClefTypeEnum,
    midi: number,
    keySignature: KeySignatureTypeEnum = KeySignatureTypeEnum.C,
    priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat = AccidentalTypeEnum.Sharp
): { region: number; accidental: AccidentalTypeEnum | null } {
    type Spelling = 'natural' | AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat
    type Candidate = { region: number; needed: AlteredAccidental | null; spelling: Spelling }

    const candidates: Candidate[] = []
    const naturalRegion = getNoteRegion(clef, midi, null)
    if (naturalRegion !== null) {
        candidates.push({region: naturalRegion, needed: null, spelling: 'natural'})
    } else {
        const alt: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat =
            priority === AccidentalTypeEnum.Sharp ? AccidentalTypeEnum.Flat : AccidentalTypeEnum.Sharp
        const spellings: (AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat)[] = [priority, alt]
        for (const spell of spellings) {
            const region = getNoteRegion(clef, midi, spell)
            if (region !== null) candidates.push({region, needed: spell, spelling: spell})
        }
    }

    const keyKind = KEY_ALTERATION[keySignature]?.kind ?? 'sharp'
    let best: { region: number; accidental: AccidentalTypeEnum | null; score: number } | null = null

    for (const {region, needed, spelling} of candidates) {
        if (getNoteMidi(clef, region, needed) !== midi) continue

        const written = resolveMinimalWritten(
            needed,
            getKeySignatureAccidental(clef, keySignature, region)
        )
        const explicitScore =
            written === null
                ? 0
                : written === AccidentalTypeEnum.Natural
                    ? 1
                    : written === AccidentalTypeEnum.Sharp || written === AccidentalTypeEnum.Flat
                        ? 2
                        : 3
        const keyColorScore =
            spelling === 'natural'
                ? 0
                : (keyKind === 'sharp' && spelling === AccidentalTypeEnum.Sharp) ||
                (keyKind === 'flat' && spelling === AccidentalTypeEnum.Flat)
                    ? 0
                    : 1
        const priorityScore = spelling === 'natural' ? 0 : spelling === priority ? 0 : 1
        const score = explicitScore * 100 + keyColorScore * 10 + priorityScore

        if (!best || score < best.score) {
            best = {region, accidental: written, score}
        }
    }

    if (best) return {region: best.region, accidental: best.accidental}

    // 不应到达；兜底保持旧行为
    const region = getNoteRegion(clef, midi, priority)!
    return {region, accidental: priority}
}

/** 给定 midi 下所有可达的 (region, 有效变音) 拼写 */
function enumeratePitchCandidates(
    clef: ClefTypeEnum,
    midi: number
): { region: number; needed: AlteredAccidental | null }[] {
    const neededOptions: (AlteredAccidental | null)[] = [
        null,
        AccidentalTypeEnum.Sharp,
        AccidentalTypeEnum.Flat,
        AccidentalTypeEnum.Double_sharp,
        AccidentalTypeEnum.Double_flat
    ]
    const candidates: { region: number; needed: AlteredAccidental | null }[] = []
    for (const needed of neededOptions) {
        const region = getNoteRegion(clef, midi, needed)
        if (region === null) continue
        if (getNoteMidi(clef, region, needed) !== midi) continue
        candidates.push({region, needed})
    }
    return candidates
}

const ALL_WRITTEN_ACCIDENTALS: AccidentalTypeEnum[] = [
    AccidentalTypeEnum.Natural,
    AccidentalTypeEnum.Sharp,
    AccidentalTypeEnum.Flat,
    AccidentalTypeEnum.Double_sharp,
    AccidentalTypeEnum.Double_flat
]

export type NoteRegionsByAccidental = {
    [K in AccidentalTypeEnum]: number | null
} & {
    /** 不写变音号（accidental 省略，非还原号） */
    none: number | null
}

/**
 * 给定 clef、midi、调号，列出每种谱面写法对应的 region。
 *
 * - 各 AccidentalTypeEnum：在该 region 上写该变音号时，音高为 midi
 * - none：省略变音号时音高为 midi 的 region（调号已覆盖或自然音）
 * - 无对应写法时为 null
 */
export function getAllNoteRegion(
    clef: ClefTypeEnum,
    midi: number,
    keySignature: KeySignatureTypeEnum = KeySignatureTypeEnum.C
): NoteRegionsByAccidental {
    const result = {} as NoteRegionsByAccidental

    for (const written of ALL_WRITTEN_ACCIDENTALS) {
        if (written === AccidentalTypeEnum.Natural) {
            const region = getNoteRegion(clef, midi, null)
            result[written] =
                region !== null && getNoteMidi(clef, region, null) === midi ? region : null
            continue
        }
        const needed = written as AlteredAccidental
        const region = getNoteRegion(clef, midi, needed)
        result[written] =
            region !== null && getNoteMidi(clef, region, needed) === midi ? region : null
    }

    result.none = null
    for (const {region, needed} of enumeratePitchCandidates(clef, midi)) {
        const keySigAcc = getKeySignatureAccidental(clef, keySignature, region)
        if (needed === keySigAcc) {
            result.none = region
            break
        }
    }

    return result
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
    targetKeySignature: KeySignatureTypeEnum
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
            oldEffective =
                explicit === AccidentalTypeEnum.Natural ? null : (explicit as AlteredAccidental)
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
    Fine_sign = 'fine_sign'
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
    for (
        let grandStaffIndex = 0;
        grandStaffIndex < musicScoreData.grandStaffs.length;
        grandStaffIndex++
    ) {
        const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
        const conductorStave = grandStaff.staves[0]
        if (!conductorStave) continue
        for (let measureIndex = 0; measureIndex < conductorStave.measures.length; measureIndex++) {
            positions.push({
                grandStaffIndex,
                measureIndex,
                measure: conductorStave.measures[measureIndex]
            })
        }
    }
    return positions
}

function getVoltaList(
    musicScoreData: MusicScore,
    measureIndexMap: Map<string, number>,
    measurePositions: MeasurePosition[]
): VoltaInfo[] {
    return musicScoreData.affiliatedSymbols.flatMap((symbol) => {
        if (
            symbol.name !== DoubleMeasureAffiliatedSymbolNameEnum.Volta ||
            !('volta' in symbol.data) ||
            !symbol.data.volta
        ) {
            return []
        }
        const startIndex = measureIndexMap.get(symbol.startId)
        const endIndex = measureIndexMap.get(symbol.endId)
        if (startIndex == null || endIndex == null) return []
        const endMeasure = measurePositions[endIndex]?.measure
        if (!isEndRepeatBarline(endMeasure?.barline_b?.type)) return []
        return [
            {
                id: symbol.id,
                startIndex,
                endIndex,
                value: symbol.data.volta.value
            }
        ]
    })
}

function disableDcState(reapeatState: RepeatState): void {
    reapeatState.dc = false
    reapeatState.dc_al_fine = false
    reapeatState.dc_al_coda = false
}

function isStartRepeatBarline(type: BarlineTypeEnum | undefined): boolean {
    return (
        type === BarlineTypeEnum.StartRepeat_barline ||
        type === BarlineTypeEnum.Start_end_repeat_barline
    )
}

function isEndRepeatBarline(type: BarlineTypeEnum | undefined): boolean {
    return (
        type === BarlineTypeEnum.EndRepeat_barline || type === BarlineTypeEnum.Start_end_repeat_barline
    )
}

function getRepeatJumpIndex(
    measure: Measure,
    measureIndex: number,
    currentRepeatStartIndex: number,
    firstSegnoIndex: number,
    firstCodaIndex: number,
    hasNextVoltaRound: boolean,
    actived: Set<string>,
    reapeatState: RepeatState,
    activateFine: () => void,
    increaseVoltaRound: () => void
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
        if (!actived.has(barlineId) || hasNextVoltaRound) {
            console.log('chicken', hasNextVoltaRound)
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
    const firstSegnoIndex = measurePositions.findIndex(
        ({measure}) => measure.startRepeat?.type === MeasureStartRepeatEnum.Segno
    )
    // 第一个coda
    const firstCodaIndex = measurePositions.findIndex(
        ({measure}) => measure.startRepeat?.type === MeasureStartRepeatEnum.Coda
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

    while (
        measureCursor >= 0 &&
        measureCursor < measurePositions.length &&
        loopGuard < maxRepeatSteps
        ) {
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
        if (
            endAnchor === EndAnchorEnum.Fine_sign &&
            measure.endRepeat?.type === MeasureEndRepeatEnum.Fine
        ) {
            break
        }
        // 判断小节的endRepeat是否生效，执行反复
        const jumpIndex = getRepeatJumpIndex(
            measure,
            measureCursor,
            currentRepeatStartIndex,
            firstSegnoIndex,
            firstCodaIndex,
            voltaByEndIndex.get(measureCursor)?.value.includes(voltaRound + 1) ?? false,
            actived,
            reapeatState,
            () => {
                endAnchor = EndAnchorEnum.Fine_sign
            },
            () => {
                voltaRound += 1
            }
        )
        // 存在跳转索引，跳转
        if (jumpIndex != null) {
            measureCursor = jumpIndex
            continue
        }
        // 如果当前停止模式是Final_barline且当前小节有Final_barline,跳出循环
        if (
            measure.barline_b?.type === BarlineTypeEnum.Final_barline &&
            endAnchor === EndAnchorEnum.Barline_final
        ) {
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
            type === BarlineTypeEnum.StartRepeat_barline ||
            type === BarlineTypeEnum.Start_end_repeat_barline
        ) {
            delete measure.barline_f
        }
    }
    if (measure.barline_b) {
        const type = measure.barline_b.type
        if (
            type === BarlineTypeEnum.EndRepeat_barline ||
            type === BarlineTypeEnum.Start_end_repeat_barline
        ) {
            measure.barline_b.type = BarlineTypeEnum.Single_barline
        }
    }
}

type NoteLocation = {
    staffIndex: number
    measureIndex: number
}

type SpanAffiliatedSymbol = MusicScore['affiliatedSymbols'][number] & {
    startId: string
    endId: string
}

const DOUBLE_MEASURE_AFFILIATED_NAMES = new Set<string>(
    Object.values(DoubleMeasureAffiliatedSymbolNameEnum)
)
const DOUBLE_NOTE_AFFILIATED_NAMES = new Set<string>(
    Object.values(DoubleNoteAffiliatedSymbolNameEnum)
)

/** 深度遍历，为子树内每个带 id 的对象生成新 id，返回 oldId → newId（单次克隆作用域） */
function regenerateIdsInSubtree(root: unknown): Map<string, string> {
    const idMap = new Map<string, string>()

    const walk = (node: unknown): void => {
        if (node == null || typeof node !== 'object') return
        if (Array.isArray(node)) {
            for (const item of node) walk(item)
            return
        }
        const obj = node as Record<string, unknown>
        if (typeof obj.id === 'string') {
            const freshId = newId()
            idMap.set(obj.id, freshId)
            obj.id = freshId
        }
        for (const key of Object.keys(obj)) {
            if (key === 'id') continue
            walk(obj[key])
        }
    }

    walk(root)
    return idMap
}

function regenerateScoreStructureIds(musicScore: MusicScore): void {
    musicScore.id = newId()
    for (const grandStaff of musicScore.grandStaffs) {
        grandStaff.id = newId()
        if (grandStaff.bracket) grandStaff.bracket.id = newId()
        for (const staff of grandStaff.staves) {
            staff.id = newId()
        }
    }
}

function forEachNoteEndpointId(measure: Measure, visit: (id: string) => void): void {
    const visitNotesInfo = (ni: NotesInfo) => {
        visit(ni.id)
    }
    const visitNotesNumberInfo = (ni: NotesNumberInfo) => {
        visit(ni.id)
        for (const g of ni.graceNotes ?? []) visitNotesNumberInfo(g)
        for (const g of ni.graceNotesAfter ?? []) visitNotesNumberInfo(g)
    }

    for (const slot of measure.notes) {
        if ('type' in slot) {
            if (slot.type !== NoteSymbolTypeEnum.Note) continue
            for (const ni of slot.notesInfo) visitNotesInfo(ni)
            for (const g of slot.graceNotes ?? []) visitNotesInfo(g)
            for (const g of slot.graceNotesAfter ?? []) visitNotesInfo(g)
        } else {
            const nn = slot as NoteNumber
            for (const ni of nn.notesInfo) visitNotesNumberInfo(ni)
        }
    }
}

function collectMeasureLocations(grandStaff: GrandStaff): Map<string, number> {
    const map = new Map<string, number>()
    const conductorStave = grandStaff.staves[0]
    if (!conductorStave) return map
    conductorStave.measures.forEach((measure, measureIndex) => {
        map.set(measure.id, measureIndex)
    })
    return map
}

function collectNoteLocations(grandStaff: GrandStaff): Map<string, NoteLocation> {
    const map = new Map<string, NoteLocation>()
    grandStaff.staves.forEach((staff, staffIndex) => {
        staff.measures.forEach((measure, measureIndex) => {
            forEachNoteEndpointId(measure, (noteId) => {
                map.set(noteId, {staffIndex, measureIndex})
            })
        })
    })
    return map
}

function findExpandedEndIndex(
    startExp: number,
    endSourceIndex: number,
    startSourceIndex: number,
    playMeasureIndexes: number[]
): number | null {
    if (startSourceIndex === endSourceIndex) return startExp
    for (let exp = startExp + 1; exp < playMeasureIndexes.length; exp++) {
        if (playMeasureIndexes[exp] === endSourceIndex) return exp
    }
    return null
}

function remapSpanAffiliatedInstances(
    sym: SpanAffiliatedSymbol,
    playMeasureIndexes: number[],
    startSourceIndex: number,
    endSourceIndex: number,
    staffIndex: number,
    idMapsByStaff: Map<string, string>[][]
): SpanAffiliatedSymbol[] {
    const staffIdMaps = idMapsByStaff[staffIndex]
    if (!staffIdMaps) return []

    const instances: SpanAffiliatedSymbol[] = []
    for (let startExp = 0; startExp < playMeasureIndexes.length; startExp++) {
        if (playMeasureIndexes[startExp] !== startSourceIndex) continue
        const endExp = findExpandedEndIndex(
            startExp,
            endSourceIndex,
            startSourceIndex,
            playMeasureIndexes
        )
        if (endExp == null) continue

        const newStartId = staffIdMaps[startExp]?.get(sym.startId)
        const newEndId = staffIdMaps[endExp]?.get(sym.endId)
        if (!newStartId || !newEndId) continue

        instances.push({
            ...sym,
            id: newId(),
            startId: newStartId,
            endId: newEndId
        })
    }
    return instances
}

/**
 * 展平后双小节 / 双音符附属符号按演奏实例复制，并重绑 startId/endId。
 * volta 展平后删除，其余类型统一处理（含未来新增符号）。
 */
function remapAffiliatedSymbols(
    affiliatedSymbols: MusicScore['affiliatedSymbols'],
    playMeasureIndexes: number[],
    measureLocations: Map<string, number>,
    noteLocations: Map<string, NoteLocation>,
    idMapsByStaff: Map<string, string>[][]
): MusicScore['affiliatedSymbols'] {
    const result: MusicScore['affiliatedSymbols'] = []

    for (const sym of affiliatedSymbols) {
        if (sym.name === DoubleMeasureAffiliatedSymbolNameEnum.Volta) continue
        if (!('startId' in sym) || !('endId' in sym)) continue

        const spanSym = sym as SpanAffiliatedSymbol

        if (DOUBLE_MEASURE_AFFILIATED_NAMES.has(sym.name)) {
            const startSourceIndex = measureLocations.get(spanSym.startId)
            const endSourceIndex = measureLocations.get(spanSym.endId)
            if (startSourceIndex == null || endSourceIndex == null) continue
            result.push(
                ...remapSpanAffiliatedInstances(
                    spanSym,
                    playMeasureIndexes,
                    startSourceIndex,
                    endSourceIndex,
                    0,
                    idMapsByStaff
                )
            )
            continue
        }

        if (DOUBLE_NOTE_AFFILIATED_NAMES.has(sym.name)) {
            const startLoc = noteLocations.get(spanSym.startId)
            const endLoc = noteLocations.get(spanSym.endId)
            if (!startLoc || !endLoc || startLoc.staffIndex !== endLoc.staffIndex) continue
            result.push(
                ...remapSpanAffiliatedInstances(
                    spanSym,
                    playMeasureIndexes,
                    startLoc.measureIndex,
                    endLoc.measureIndex,
                    startLoc.staffIndex,
                    idMapsByStaff
                )
            )
        }
    }

    return result
}

function expandMeasuresByPlayIndexes(
    sourceMeasures: Measure[],
    playMeasureIndexes: number[]
): { measures: Measure[]; idMaps: Map<string, string>[] } {
    const idMaps: Map<string, string>[] = []

    const measures = playMeasureIndexes.map((sourceIndex, expandedIndex) => {
        const measure = cloneMeasure(sourceMeasures[sourceIndex]!)
        stripMeasureRepeatSymbols(measure)
        if (
            expandedIndex < playMeasureIndexes.length - 1 &&
            measure.barline_b?.type === BarlineTypeEnum.Final_barline
        ) {
            measure.barline_b.type = BarlineTypeEnum.Single_barline
        }
        idMaps.push(regenerateIdsInSubtree(measure))
        return measure
    })

    return {measures, idMaps}
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

    const measureLocations = collectMeasureLocations(mergedGrandStaff)
    const noteLocations = collectNoteLocations(mergedGrandStaff)
    const playMeasureIndexes = getPlayMeasureIndexes(musicScore)
    const idMapsByStaff: Map<string, string>[][] = []

    for (let staffIndex = 0; staffIndex < expectedCount; staffIndex++) {
        const sourceMeasures = mergedGrandStaff.staves[staffIndex]!.measures
        const {measures: expanded, idMaps} = expandMeasuresByPlayIndexes(
            sourceMeasures,
            playMeasureIndexes
        )
        mergedGrandStaff.staves[staffIndex]!.measures = expanded
        dedupeMeasureFrontSymbols(expanded)
        idMapsByStaff[staffIndex] = idMaps
    }

    musicScore.affiliatedSymbols = remapAffiliatedSymbols(
        musicScore.affiliatedSymbols,
        playMeasureIndexes,
        measureLocations,
        noteLocations,
        idMapsByStaff
    )
    regenerateScoreStructureIds(musicScore)
    return musicScore
}

/** 黑键 → 自然音级（0=C…6=B）；升号优先取低邻音，降号优先取高邻音 */
const SHARP_SPELLING_DEGREE: Partial<Record<number, number>> = {1: 0, 3: 1, 6: 3, 8: 4, 10: 5}
const FLAT_SPELLING_DEGREE: Partial<Record<number, number>> = {1: 1, 3: 2, 6: 4, 8: 5, 10: 6}

/**
 * midi → 简谱唱名与八度点（固定调 C=do，不考虑谱号/调号）。
 * octave 对应 NotesNumberInfo.octaveDot：C4(midi 60) → 0。
 * 黑键按 priority 决定归属唱名与变音记号。
 */
export function getOctaveAndSyllable(
    midi: number,
    priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat = AccidentalTypeEnum.Sharp
): {
    octave: number
    syllable: number
    accidental: AccidentalTypeEnum | null
} {
    const pitch = Math.round(midi)
    const semitone = ((pitch % 12) + 12) % 12
    const octave = Math.floor(pitch / 12) - 5

    const naturalDegree = DIATONIC_SEMITONES.indexOf(semitone)
    if (naturalDegree >= 0) {
        return {octave, syllable: naturalDegree + 1, accidental: null}
    }

    const spellingMap =
        priority === AccidentalTypeEnum.Sharp ? SHARP_SPELLING_DEGREE : FLAT_SPELLING_DEGREE
    const degree = spellingMap[semitone] ?? 0
    const accidental =
        priority === AccidentalTypeEnum.Sharp ? AccidentalTypeEnum.Sharp : AccidentalTypeEnum.Flat
    return {octave, syllable: degree + 1, accidental}
}

/** NotesNumberInfo → midi（固定调 C=do，与 getOctaveAndSyllable 互逆） */
export function getNoteNumberMidi(noteNumberInfo: NotesNumberInfo): number {
    const {syllable, accidental} = noteNumberInfo
    if (syllable === 0 || syllable === 'X') {
        throw new Error('休止符或节奏音符无 midi 音高')
    }

    const degree = syllable - 1
    const baseSemitone = DIATONIC_SEMITONES[degree]
    if (baseSemitone == null) {
        throw new Error(`无效唱名 syllable=${syllable}`)
    }

    let accOffset = 0
    if (accidental && accidental.type !== AccidentalTypeEnum.Natural) {
        accOffset = ACC_OFFSET_MAP[accidental.type as AlteredAccidental] ?? 0
    }

    const octaveDot = noteNumberInfo.octaveDot ?? 0
    const semitone = (((baseSemitone + accOffset) % 12) + 12) % 12
    return (octaveDot + 5) * 12 + semitone
}
