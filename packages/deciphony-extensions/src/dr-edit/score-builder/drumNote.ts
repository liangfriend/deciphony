/**
 * 鼓谱音符数据 API。
 * 小节 notes 为上下声部 `{up, down}`：up 声部符干向上、down 声部符干向下，两声部各自计 onset。
 * region 与五线谱同网格：0 为底线，8 为顶线。
 * 音符与休止符时值最长均为四分（chronaxie ≤ 64），无全音符 / 二分音符及对应休止符。
 */
import {BeamTypeEnum, DrumHeadTypeEnum, isMeasureNoteVoices, NoteSymbolTypeEnum, slotSymbol} from '@deciphony/renderer'
import type {
    AugmentationDot,
    Chronaxie,
    DrumNote,
    DrumNotesInfo,
    DrumRest,
    Measure,
    MeasureNoteSlot,
    MeasureNoteSymbol,
    MeasureNoteVoices,
    MusicScore,
} from '@deciphony/renderer'
import {chronaxieWithDots, resolveDefaultBeamType} from './autoBeam'
import {ZERO_FRAME} from './constants'
import {assertIndex, newId} from './id'
import {createAugmentationDot, createMeasureNoteSlot} from './factories'

export type DrumVoice = 'up' | 'down'

/** 鼓谱音符 / 休止符可用时值（无全音符 / 二分音符） */
export const DRUM_CHRONAXIES: readonly Chronaxie[] = [64, 32, 16, 8, 4, 2, 1]
/** 鼓谱音符 / 休止符最长时值（四分） */
export const DRUM_MAX_CHRONAXIE: Chronaxie = 64
/** 各声部休止符默认线位：up 在第四线，down 在第二线 */
export const DRUM_REST_DEFAULT_REGION: Record<DrumVoice, number> = {up: 6, down: 2}

type DotInput = AugmentationDot | 1 | 2 | 3 | null | undefined

function toAugmentationDot(dot: DotInput): AugmentationDot | undefined {
    if (dot == null) return undefined
    if (typeof dot === 'number') return createAugmentationDot(dot)
    return dot
}

/** 时值夹到 ≤ 四分 */
export function clampDrumChronaxie(chronaxie: Chronaxie): Chronaxie {
    return chronaxie > DRUM_MAX_CHRONAXIE ? DRUM_MAX_CHRONAXIE : chronaxie
}

export function isDrumNoteBody(body: MeasureNoteSymbol | null | undefined): body is DrumNote {
    if (body == null || (body as DrumNote).type !== NoteSymbolTypeEnum.Note) return false
    const notesInfo = (body as DrumNote).notesInfo
    return Array.isArray(notesInfo) && notesInfo.length > 0 && notesInfo.every((info) => 'headType' in info)
}

export function isDrumRestBody(body: MeasureNoteSymbol | null | undefined): body is DrumRest {
    return body != null
        && (body as DrumRest).type === NoteSymbolTypeEnum.Rest
        && typeof (body as DrumRest).region === 'number'
}

export function isDrumNotesInfo(info: unknown): info is DrumNotesInfo {
    return info != null && typeof info === 'object' && 'headType' in info && 'region' in info
}

/** 把数组形式的 notes 转成上下声部（原数组归入 up），返回可原地修改的声部对象 */
export function ensureMeasureVoices(measure: Measure): MeasureNoteVoices {
    if (!isMeasureNoteVoices(measure.notes)) {
        measure.notes = {up: measure.notes, down: []}
    }
    const voices = measure.notes as MeasureNoteVoices
    if (!voices.up) voices.up = []
    if (!voices.down) voices.down = []
    return voices
}

/** 可原地增删的声部槽位数组 */
export function getDrumVoiceSlots(measure: Measure, voice: DrumVoice): MeasureNoteSlot[] {
    return ensureMeasureVoices(measure)[voice]
}

/** 槽位时值（含附点） */
export function drumSlotDuration(measureSlot: MeasureNoteSlot): number {
    const body = slotSymbol(measureSlot)
    if (isDrumRestBody(body)) return chronaxieWithDots(body.chronaxie, body.augmentationDot?.count ?? 0)
    if (isDrumNoteBody(body)) {
        const lead = body.notesInfo[0]!
        return chronaxieWithDots(lead.chronaxie, lead.augmentationDot?.count ?? 0)
    }
    return 0
}

/** 声部内下标 `index` 之前的时值之和（即该处插入的 onset） */
export function computeDrumVoiceOnsetBefore(measure: Measure, voice: DrumVoice, index: number): number {
    const slots = isMeasureNoteVoices(measure.notes)
        ? (measure.notes[voice] ?? [])
        : (voice === 'up' ? measure.notes : [])
    const end = Math.max(0, Math.min(index, slots.length))
    let onset = 0
    for (let i = 0; i < end; i++) onset += drumSlotDuration(slots[i]!)
    return onset
}

export type CreateDrumNotesInfoOptions = {
    region?: number
    headType?: DrumHeadTypeEnum
    /** 超过四分音符会被夹到 64 */
    chronaxie?: Chronaxie
    beamType?: BeamTypeEnum
    /** 未给 beamType 时按 onset 自动推算符杠 */
    beamOnset?: number
    augmentationDot?: DotInput
    ghost?: boolean
}

export function createDrumNotesInfo(options: CreateDrumNotesInfoOptions = {}): DrumNotesInfo {
    const chronaxie = clampDrumChronaxie(options.chronaxie ?? 64)
    const info: DrumNotesInfo = {
        ...ZERO_FRAME,
        id: newId(),
        region: Math.round(options.region ?? 4),
        headType: options.headType ?? DrumHeadTypeEnum.Normal,
        chronaxie,
        beamType: resolveDefaultBeamType({
            chronaxie,
            ...(options.beamType != null ? {beamType: options.beamType} : {}),
            ...(options.beamOnset != null ? {beamOnset: options.beamOnset} : {}),
        }),
        affiliatedSymbols: [],
    }
    const dot = toAugmentationDot(options.augmentationDot)
    if (dot) info.augmentationDot = dot
    if (options.ghost) info.ghost = true
    return info
}

/** 倚音默认八分音符；多颗且未给 beamType 时默认连杠 */
export const DRUM_GRACE_DEFAULT_CHRONAXIE: Chronaxie = 32

export type CreateDrumGraceOptions = Omit<CreateDrumNotesInfoOptions, 'beamOnset'>

export type CreateDrumNoteOptions = CreateDrumNotesInfoOptions & {
    /** 前倚音：index0 最靠主音 */
    graceNotes?: CreateDrumGraceOptions[]
    /** 后倚音：index0 最靠主音 */
    graceNotesAfter?: CreateDrumGraceOptions[]
}

export function createDrumGraceList(list: CreateDrumGraceOptions[] | undefined): DrumNotesInfo[] | undefined {
    if (!list?.length) return undefined
    const beamDefault = list.length > 1 ? BeamTypeEnum.Combined : BeamTypeEnum.None
    return list.map((g) => createDrumNotesInfo({
        ...g,
        chronaxie: g.chronaxie ?? DRUM_GRACE_DEFAULT_CHRONAXIE,
        beamType: g.beamType ?? beamDefault,
    }))
}

export function createDrumNote(options: CreateDrumNoteOptions = {}): MeasureNoteSlot {
    const {graceNotes, graceNotesAfter, ...infoOptions} = options
    const symbol: DrumNote = {
        ...ZERO_FRAME,
        id: newId(),
        type: NoteSymbolTypeEnum.Note,
        notesInfo: [createDrumNotesInfo(infoOptions)],
    }
    const before = createDrumGraceList(graceNotes)
    const after = createDrumGraceList(graceNotesAfter)
    if (before) symbol.graceNotes = before
    if (after) symbol.graceNotesAfter = after
    return createMeasureNoteSlot({symbol})
}

export type CreateDrumRestOptions = {
    /** 超过四分会被夹到 64 */
    chronaxie?: Chronaxie
    /** 休止符中心线位；缺省按声部取 DRUM_REST_DEFAULT_REGION */
    region?: number
    voice?: DrumVoice
    augmentationDot?: DotInput
}

export function createDrumRest(options: CreateDrumRestOptions = {}): MeasureNoteSlot {
    const symbol: DrumRest = {
        ...ZERO_FRAME,
        id: newId(),
        type: NoteSymbolTypeEnum.Rest,
        region: Math.round(options.region ?? DRUM_REST_DEFAULT_REGION[options.voice ?? 'up']),
        chronaxie: clampDrumChronaxie(options.chronaxie ?? 64),
        affiliatedSymbols: [],
    }
    const dot = toAugmentationDot(options.augmentationDot)
    if (dot) symbol.augmentationDot = dot
    return createMeasureNoteSlot({symbol})
}

function insertIntoVoice(measure: Measure, voice: DrumVoice, at: number, slot: MeasureNoteSlot): MeasureNoteSlot {
    const slots = getDrumVoiceSlots(measure, voice)
    assertIndex('noteIndex', at, slots.length + 1)
    slots.splice(at, 0, slot)
    return slot
}

/** 在声部指定下标插入音符；未给 beamType / beamOnset 时按声部 onset 自动连杠 */
export function insertDrumNote(
    measure: Measure,
    voice: DrumVoice,
    at: number,
    options: CreateDrumNoteOptions = {},
): MeasureNoteSlot {
    const withBeam = options.beamType != null || options.beamOnset != null
        ? options
        : {...options, beamOnset: computeDrumVoiceOnsetBefore(measure, voice, at)}
    return insertIntoVoice(measure, voice, at, createDrumNote(withBeam))
}

export function insertDrumRest(
    measure: Measure,
    voice: DrumVoice,
    at: number,
    options: Omit<CreateDrumRestOptions, 'voice'> = {},
): MeasureNoteSlot {
    return insertIntoVoice(measure, voice, at, createDrumRest({...options, voice}))
}

export function appendDrumNote(measure: Measure, voice: DrumVoice, options: CreateDrumNoteOptions = {}): MeasureNoteSlot {
    return insertDrumNote(measure, voice, getDrumVoiceSlots(measure, voice).length, options)
}

export function appendDrumRest(
    measure: Measure,
    voice: DrumVoice,
    options: Omit<CreateDrumRestOptions, 'voice'> = {},
): MeasureNoteSlot {
    return insertDrumRest(measure, voice, getDrumVoiceSlots(measure, voice).length, options)
}

/** 移除声部内指定下标的槽位 */
export function removeDrumSlot(measure: Measure, voice: DrumVoice, index: number): MeasureNoteSlot {
    const slots = getDrumVoiceSlots(measure, voice)
    assertIndex('noteIndex', index, slots.length)
    return slots.splice(index, 1)[0]!
}

/**
 * 向已有鼓谱音符追加一个音符头（同 region 已存在时返回 null）。
 * 时值 / 符杠 / 附点跟随首个音符头。
 */
export function appendDrumNotesInfo(
    note: DrumNote,
    options: Omit<CreateDrumNotesInfoOptions, 'chronaxie' | 'beamType' | 'beamOnset' | 'augmentationDot'> = {},
): DrumNotesInfo | null {
    const region = Math.round(options.region ?? 4)
    if (note.notesInfo.some((info) => info.region === region)) return null
    const lead = note.notesInfo[0]
    const info = createDrumNotesInfo({
        ...options,
        region,
        chronaxie: lead?.chronaxie,
        beamType: lead?.beamType ?? BeamTypeEnum.None,
        augmentationDot: lead?.augmentationDot ? lead.augmentationDot.count as 1 | 2 | 3 : undefined,
    })
    note.notesInfo.push(info)
    return info
}

/**
 * 移除音符头；只剩一个时移除整个槽位。
 * 返回 'info' / 'slot'，找不到时 null。
 */
export function removeDrumNotesInfo(measure: Measure, infoId: string): 'info' | 'slot' | null {
    for (const voice of ['up', 'down'] as const) {
        const slots = getDrumVoiceSlots(measure, voice)
        for (let i = 0; i < slots.length; i++) {
            const body = slotSymbol(slots[i]!)
            if (!isDrumNoteBody(body)) continue
            const idx = body.notesInfo.findIndex((info) => info.id === infoId)
            if (idx < 0) continue
            if (body.notesInfo.length <= 1) {
                slots.splice(i, 1)
                return 'slot'
            }
            body.notesInfo.splice(idx, 1)
            return 'info'
        }
    }
    return null
}

/** 按休止符 id 移除 */
export function removeDrumRest(measure: Measure, restId: string): boolean {
    for (const voice of ['up', 'down'] as const) {
        const slots = getDrumVoiceSlots(measure, voice)
        const idx = slots.findIndex((slot) => slotSymbol(slot).id === restId)
        if (idx >= 0) {
            slots.splice(idx, 1)
            return true
        }
    }
    return false
}

export function setDrumNotesInfoHeadType(info: DrumNotesInfo, headType: DrumHeadTypeEnum): void {
    info.headType = headType
}

/** 改线位；同一音符内已有该线位时不改，返回是否修改 */
export function setDrumNotesInfoRegion(info: DrumNotesInfo, region: number, note?: DrumNote): boolean {
    const next = Math.round(region)
    if (info.region === next) return false
    if (note?.notesInfo.some((other) => other !== info && other.region === next)) return false
    info.region = next
    return true
}

export function setDrumNotesInfoGhost(info: DrumNotesInfo, ghost: boolean): void {
    if (ghost) info.ghost = true
    else delete info.ghost
}

/** 整个音符（全部音符头）改时值，超过四分会被夹到 64 */
export function setDrumNoteChronaxie(note: DrumNote, chronaxie: Chronaxie): void {
    const next = clampDrumChronaxie(chronaxie)
    for (const info of note.notesInfo) info.chronaxie = next
}

export function setDrumNoteBeamType(note: DrumNote, beamType: BeamTypeEnum): void {
    for (const info of note.notesInfo) info.beamType = beamType
}

/** 整个音符改附点；0 / null 清除 */
export function setDrumNoteAugmentationDot(note: DrumNote, count: 0 | 1 | 2 | 3 | null): void {
    for (const info of note.notesInfo) {
        if (!count) delete info.augmentationDot
        else if (info.augmentationDot) info.augmentationDot.count = count
        else info.augmentationDot = createAugmentationDot(count)
    }
}

/** 超过四分会被夹到 64 */
export function setDrumRestChronaxie(rest: DrumRest, chronaxie: Chronaxie): void {
    rest.chronaxie = clampDrumChronaxie(chronaxie)
}

export function setDrumRestRegion(rest: DrumRest, region: number): boolean {
    const next = Math.round(region)
    if (rest.region === next) return false
    rest.region = next
    return true
}

export function setDrumRestAugmentationDot(rest: DrumRest, count: 0 | 1 | 2 | 3 | null): void {
    if (!count) delete rest.augmentationDot
    else if (rest.augmentationDot) rest.augmentationDot.count = count
    else rest.augmentationDot = createAugmentationDot(count)
}

type LocatedDrumSlotBase = {
    grandStaff: MusicScore['grandStaffs'][number]
    singleStaff: MusicScore['grandStaffs'][number]['staves'][number]
    measure: Measure
    voice: DrumVoice
    slotIndex: number
    slot: MeasureNoteSlot
}

export type LocatedDrumNotesInfo = LocatedDrumSlotBase & {note: DrumNote; info: DrumNotesInfo}
export type LocatedDrumRest = LocatedDrumSlotBase & {rest: DrumRest}

function* walkDrumSlots(score: MusicScore): Generator<LocatedDrumSlotBase> {
    for (const grandStaff of score.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                const notes = measure.notes
                const voices: [DrumVoice, MeasureNoteSlot[]][] = isMeasureNoteVoices(notes)
                    ? [['up', notes.up ?? []], ['down', notes.down ?? []]]
                    : [['up', notes]]
                for (const [voice, slots] of voices) {
                    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
                        yield {grandStaff, singleStaff, measure, voice, slotIndex, slot: slots[slotIndex]!}
                    }
                }
            }
        }
    }
}

export function locateDrumNotesInfoById(score: MusicScore, id: string): LocatedDrumNotesInfo | null {
    for (const located of walkDrumSlots(score)) {
        const body = slotSymbol(located.slot)
        if (!isDrumNoteBody(body)) continue
        const info = body.notesInfo.find((item) => item.id === id)
        if (info) return {...located, note: body, info}
    }
    return null
}

export function locateDrumRestById(score: MusicScore, id: string): LocatedDrumRest | null {
    for (const located of walkDrumSlots(score)) {
        const body = slotSymbol(located.slot)
        if (isDrumRestBody(body) && body.id === id) return {...located, rest: body}
    }
    return null
}
