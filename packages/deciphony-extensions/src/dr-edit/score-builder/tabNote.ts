/**
 * 吉他谱（tab6）与尤克里里谱（tab4）共用的音符数据 API。
 * 弦索引用 0 起；展示层的 1 弦对应 region 0。弦数由曲谱类型决定（6 / 4）。
 */
import {
    BeamTypeEnum,
    BendTypeEnum,
    MusicScoreTypeEnum,
    NoteSymbolTypeEnum,
    TabNoteInfoTypeEnum,
} from '@deciphony/renderer'
import type {
    Bend,
    Chronaxie,
    DoubleNoteAffiliatedSymbol,
    Measure,
    MusicScore,
    SlurTypeEnum,
    TabNote,
    TabNoteInfo,
    TabRest,
    tabChord,
} from '@deciphony/renderer'
import {resolveDefaultBeamType, computeMeasureOnsetBefore} from './autoBeam'
import {ZERO_FRAME} from './constants'
import {newId} from './id'
import {insertNoteSlot} from './noteSlot'

export const TAB6_STRING_COUNT = 6
export const TAB4_STRING_COUNT = 4

export type TabAddKind = 'normal' | 'harmonic' | 'arpeggio' | 'strumming' | 'rest'

export function tabStringCount(type: MusicScoreTypeEnum | undefined): number {
    return type === MusicScoreTypeEnum.Tab4 ? TAB4_STRING_COUNT : TAB6_STRING_COUNT
}

export function clampTabFret(value: number): number {
    if (value < 0) return -1
    if (value > 27) return 27
    return Math.round(value)
}

export function clampTabRegion(region: number, stringCount: number): number {
    const max = Math.max(0, stringCount - 1)
    if (region < 0) return 0
    if (region > max) return max
    return Math.round(region)
}

export function isTabHeadInfo(
    info: TabNoteInfo,
): info is TabNoteInfo & {type: TabNoteInfoTypeEnum.Normal | TabNoteInfoTypeEnum.Harmonic; region: number} {
    return info.type === TabNoteInfoTypeEnum.Normal || info.type === TabNoteInfoTypeEnum.Harmonic
}

export function isTabGeometryInfo(
    info: TabNoteInfo,
): info is TabNoteInfo & {type: TabNoteInfoTypeEnum.Arpeggio | TabNoteInfoTypeEnum.Strumming} {
    return info.type === TabNoteInfoTypeEnum.Arpeggio || info.type === TabNoteInfoTypeEnum.Strumming
}

export type CreateTabNoteOptions = {
    kind?: Exclude<TabAddKind, 'rest'>
    chronaxie?: Chronaxie
    /** 品；-1 为 x。琶音 / 扫弦忽略 */
    value?: number
    /** 标准音 / 泛音所在弦，0 起 */
    region?: number
    /** 琶音 / 扫弦起点弦，0 起 */
    regionStart?: number
    /** 琶音 / 扫弦终点弦，0 起 */
    regionEnd?: number
    stringCount?: number
    beamType?: BeamTypeEnum
    beamOnset?: number
    isSlap?: boolean
}

function emptyChord(stringCount: number): tabChord {
    return {
        ...ZERO_FRAME,
        id: newId(),
        width: 50,
        height: 60,
        stringCount,
        name: '',
        fretCount: 5,
        baseFret: 0,
        barres: [],
        tuning: [],
        stringStates: [],
    }
}

export function createTabNoteInfo(options: CreateTabNoteOptions = {}): TabNoteInfo {
    const stringCount = options.stringCount ?? TAB6_STRING_COUNT
    const chronaxie = options.chronaxie ?? 64
    const kind = options.kind ?? 'normal'
    const beamType = resolveDefaultBeamType({
        chronaxie,
        ...(options.beamType != null ? {beamType: options.beamType} : {}),
        ...(options.beamOnset != null ? {beamOnset: options.beamOnset} : {}),
    })
    const common = {
        ...ZERO_FRAME,
        id: newId(),
        chronaxie,
        value: clampTabFret(options.value ?? 0),
        beamType,
        affiliatedSymbols: [],
    }
    if (kind === 'arpeggio' || kind === 'strumming') {
        return {
            ...common,
            type: kind === 'arpeggio' ? TabNoteInfoTypeEnum.Arpeggio : TabNoteInfoTypeEnum.Strumming,
            regionRange: {
                start: clampTabRegion(options.regionStart ?? 0, stringCount),
                end: clampTabRegion(options.regionEnd ?? stringCount - 1, stringCount),
            },
        }
    }
    return {
        ...common,
        type: kind === 'harmonic' ? TabNoteInfoTypeEnum.Harmonic : TabNoteInfoTypeEnum.Normal,
        region: clampTabRegion(options.region ?? 0, stringCount),
    }
}

export function createTabNote(options: CreateTabNoteOptions = {}): TabNote & {lyrics: []; data: object} {
    return {
        ...ZERO_FRAME,
        id: newId(),
        type: NoteSymbolTypeEnum.Note,
        notesInfo: [createTabNoteInfo(options)],
        // 不默认挂空和弦图；需要时再显式写入 chord
        isSlap: options.isSlap ?? false,
        lyrics: [],
        data: {},
    }
}

/** 显式挂一个空和弦图（供属性栏添加和弦用） */
export function ensureTabNoteChord(note: TabNote, stringCount = TAB6_STRING_COUNT): tabChord {
    if (note.chord) return note.chord
    note.chord = emptyChord(stringCount)
    return note.chord
}

/** 设置 / 清除音符上的和弦图；传入 null 清除 */
export function setTabNoteChord(note: TabNote, chord: tabChord | null): void {
    if (chord == null) {
        delete note.chord
        return
    }
    note.chord = {
        ...chord,
        id: chord.id || newId(),
    }
}

export function createTabRest(options: {chronaxie?: Chronaxie} = {}): TabRest & {lyrics: []; data: object} {
    return {
        ...ZERO_FRAME,
        id: newId(),
        type: NoteSymbolTypeEnum.Rest,
        chronaxie: options.chronaxie ?? 64,
        lyrics: [],
        data: {},
    }
}

export function insertTabNote(measure: Measure, at: number, options: CreateTabNoteOptions = {}): TabNote {
    const withBeam = options.beamType != null || options.beamOnset != null
        ? options
        : {...options, beamOnset: computeMeasureOnsetBefore(measure, at)}
    return insertNoteSlot(measure, at, createTabNote(withBeam)) as TabNote
}

export function insertTabRest(measure: Measure, at: number, chronaxie?: Chronaxie): TabRest {
    const rest = chronaxie == null ? createTabRest() : createTabRest({chronaxie})
    return insertNoteSlot(measure, at, rest) as TabRest
}

export function appendTabNoteInfo(note: TabNote, options: CreateTabNoteOptions = {}): TabNoteInfo {
    const lead = note.notesInfo[0]
    const info = createTabNoteInfo({
        chronaxie: lead?.chronaxie,
        beamType: lead?.beamType,
        stringCount: note.chord?.stringCount,
        ...options,
    })
    note.notesInfo.push(info)
    return info
}

export function setTabNoteInfoValue(info: TabNoteInfo, value: number): void {
    info.value = clampTabFret(value)
}

export function setTabNoteInfoRegion(
    info: TabNoteInfo,
    region: number,
    stringCount: number,
    note?: TabNote,
): boolean {
    if (!isTabHeadInfo(info)) return false
    const next = clampTabRegion(region, stringCount)
    if (info.region === next) return false
    if (note?.notesInfo.some((other) => other !== info && isTabHeadInfo(other) && other.region === next)) {
        return false
    }
    info.region = next
    return true
}

export function setTabNoteInfoRegionRange(
    info: TabNoteInfo,
    start: number,
    end: number,
    stringCount: number,
): boolean {
    if (!isTabGeometryInfo(info)) return false
    info.regionRange = {
        start: clampTabRegion(start, stringCount),
        end: clampTabRegion(end, stringCount),
    }
    return true
}

export function setTabNoteInfoBeamType(info: TabNoteInfo, beamType: BeamTypeEnum): void {
    info.beamType = beamType
}

export function setTabNoteSlap(note: TabNote, isSlap: boolean): void {
    note.isSlap = isSlap
}

export function setTabNoteInfoBend(
    info: TabNoteInfo,
    next: {type: BendTypeEnum; periodOne: number; periodTwo: number} | null,
): boolean {
    if (!isTabHeadInfo(info)) return false
    if (next == null) {
        delete info.bend
        return true
    }
    if (info.bend) {
        info.bend.type = next.type
        info.bend.periodOne = next.periodOne
        info.bend.periodTwo = next.periodTwo
        return true
    }
    const bend: Bend = {
        ...ZERO_FRAME,
        id: newId(),
        type: next.type,
        periodOne: next.periodOne,
        periodTwo: next.periodTwo,
    }
    info.bend = bend
    return true
}

export function setSlurType(slur: DoubleNoteAffiliatedSymbol, type?: SlurTypeEnum): void {
    if (!slur.data.slur) return
    if (type == null) {
        delete slur.data.slur.type
        return
    }
    slur.data.slur.type = type
}

export type LocatedTabNoteInfo = {
    grandStaff: MusicScore['grandStaffs'][number]
    singleStaff: MusicScore['grandStaffs'][number]['staves'][number]
    measure: Measure
    note: TabNote
    info: TabNoteInfo
}

function isTabNoteSlot(slot: Measure['notes'][number]): slot is TabNote & Measure['notes'][number] {
    return 'isSlap' in slot && 'notesInfo' in slot
}

export function locateTabNoteInfoById(score: MusicScore, id: string): LocatedTabNoteInfo | null {
    for (const grandStaff of score.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                for (const slot of measure.notes) {
                    if (!isTabNoteSlot(slot)) continue
                    const info = slot.notesInfo.find((item) => item.id === id)
                    if (info) return {grandStaff, singleStaff, measure, note: slot, info}
                }
            }
        }
    }
    return null
}

export function locateTabBendById(score: MusicScore, id: string): (LocatedTabNoteInfo & {bend: Bend}) | null {
    for (const grandStaff of score.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                for (const slot of measure.notes) {
                    if (!isTabNoteSlot(slot)) continue
                    for (const info of slot.notesInfo) {
                        if (isTabHeadInfo(info) && info.bend?.id === id) {
                            return {grandStaff, singleStaff, measure, note: slot, info, bend: info.bend}
                        }
                    }
                }
            }
        }
    }
    return null
}
