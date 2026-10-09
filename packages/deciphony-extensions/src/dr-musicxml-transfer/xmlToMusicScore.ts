import {
    AccidentalTypeEnum,
    BarlineTypeEnum,
    BeamTypeEnum,
    BracketTypeEnum,
    ClefTypeEnum,
    HairpinTypeEnum,
    KeySignatureTypeEnum,
    MusicScoreTypeEnum,
    PitchTypeEnum,
    getMeasureNoteList,
    getMeasureSlots,
    isNoteRest,
    slotSymbol,
    type Chronaxie,
    type Measure,
    type MeasureNoteSlot,
    type MusicScore,
    type NoteRest,
    type NoteSymbol,
    type NotesInfo,
    type SingleNoteAffiliatedSymbolNameEnum,
    type SingleStaff,
    type TimeSignatureTypeEnum,
} from '@deciphony/renderer'
import {
    DEFAULT_MEASURE_HEIGHT,
    DEFAULT_SPACING,
    ZERO_FRAME,
    createAccidental,
    createArpeggio,
    createBarline,
    createBracket,
    createClef,
    createGrandStaff,
    createHairpin,
    createKeySignature,
    createLyrics,
    createMeasure,
    createMeasureEndRepeat,
    createMeasureStartRepeat,
    createMusicScore,
    createNoteRest,
    createNoteSymbol,
    createNotesInfo,
    createPedal,
    createPitch,
    createSingleStaff,
    createSlur,
    createTimeSignature,
    createTrill,
    createVolta,
    newId,
    resolveAutoBeamType,
    type CreateNotesInfoOptions,
} from '../dr-edit/score-builder'
import {CLEF_ANCHOR, DIATONIC_LETTERS} from '../scoreUtil'
import {readScoreIR, type BarlineIR, type MeasureIR, type NoteEv, type PartIR, type ScoreIR} from './xmlRead'

export type XmlToMusicScoreOptions = {
    /** 曲谱宽度，默认 1000 */
    width?: number
    /** 原谱没有换行信息时每行小节数，默认 4 */
    measuresPerLine?: number
    /** 原谱一行超过该小节数时平均拆成多行，默认 8 */
    maxMeasuresPerLine?: number
}

export type XmlToMusicScoreResult = {
    musicScore: MusicScore
    /** 导入时丢弃 / 近似处理的内容说明；不影响结果可用 */
    warnings: string[]
}

const EPS = 0.01
const TOP_SPACE_HEIGHT = 16
const CHRONAXIE_STEPS: Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1]

const FIFTHS_TO_KEY: Record<number, KeySignatureTypeEnum> = {
    [-7]: KeySignatureTypeEnum.C_flat,
    [-6]: KeySignatureTypeEnum.G_flat,
    [-5]: KeySignatureTypeEnum.D_flat,
    [-4]: KeySignatureTypeEnum.A_flat,
    [-3]: KeySignatureTypeEnum.E_flat,
    [-2]: KeySignatureTypeEnum.B_flat,
    [-1]: KeySignatureTypeEnum.F,
    0: KeySignatureTypeEnum.C,
    1: KeySignatureTypeEnum.G,
    2: KeySignatureTypeEnum.D,
    3: KeySignatureTypeEnum.A,
    4: KeySignatureTypeEnum.E,
    5: KeySignatureTypeEnum.B,
    6: KeySignatureTypeEnum.F_sharp,
    7: KeySignatureTypeEnum.C_sharp,
}

const SHARP_ORDER = 'FCGDAEB'
const FLAT_ORDER = 'BEADGCF'

const BAR_STYLE: Record<string, BarlineTypeEnum> = {
    regular: BarlineTypeEnum.Single_barline,
    dotted: BarlineTypeEnum.Dotted_barline,
    dashed: BarlineTypeEnum.Dashed_barline,
    heavy: BarlineTypeEnum.Heavy_barline,
    'light-light': BarlineTypeEnum.Double_barline,
    'light-heavy': BarlineTypeEnum.Final_barline,
    'heavy-light': BarlineTypeEnum.Reverse_barline,
    'heavy-heavy': BarlineTypeEnum.Heavy_double_barline,
}

const ACCIDENTAL_TEXT: Record<string, AccidentalTypeEnum> = {
    sharp: AccidentalTypeEnum.Sharp,
    flat: AccidentalTypeEnum.Flat,
    natural: AccidentalTypeEnum.Natural,
    'double-sharp': AccidentalTypeEnum.Double_sharp,
    'sharp-sharp': AccidentalTypeEnum.Double_sharp,
    'flat-flat': AccidentalTypeEnum.Double_flat,
    'double-flat': AccidentalTypeEnum.Double_flat,
    'natural-sharp': AccidentalTypeEnum.Sharp,
    'natural-flat': AccidentalTypeEnum.Flat,
}

function alterToAccidental(alter: number): AccidentalTypeEnum | undefined {
    switch (Math.round(alter)) {
        case 0:
            return AccidentalTypeEnum.Natural
        case 1:
            return AccidentalTypeEnum.Sharp
        case -1:
            return AccidentalTypeEnum.Flat
        case 2:
            return AccidentalTypeEnum.Double_sharp
        case -2:
            return AccidentalTypeEnum.Double_flat
        default:
            return undefined
    }
}

function keyAlter(step: string, fifths: number): number {
    if (fifths > 0) return SHARP_ORDER.slice(0, fifths).includes(step) ? 1 : 0
    if (fifths < 0) return FLAT_ORDER.slice(0, -fifths).includes(step) ? -1 : 0
    return 0
}

function dotted(chronaxie: number, dots: number): number {
    let total = chronaxie
    let add = chronaxie
    for (let i = 0; i < dots; i++) {
        add /= 2
        total += add
    }
    return total
}

/** 实际时长 → 最接近的记谱时值（含附点） */
function fromUnits(units: number): { chronaxie: Chronaxie; dots: number } {
    for (const c of CHRONAXIE_STEPS) {
        for (let d = 0; d <= 2; d++) {
            if (Math.abs(dotted(c, d) - units) < EPS) return {chronaxie: c, dots: d}
        }
    }
    return {chronaxie: CHRONAXIE_STEPS.find((c) => c <= units + EPS) ?? 1, dots: 0}
}

/** 空档拆成若干休止符（从大到小） */
function splitRests(units: number): Chronaxie[] {
    const out: Chronaxie[] = []
    let rest = units
    while (rest >= 1 - EPS && out.length < 64) {
        const c = CHRONAXIE_STEPS.find((v) => v <= rest + EPS) ?? 1
        out.push(c)
        rest -= c
    }
    return out
}

function displayOf(ev: NoteEv): { chronaxie: Chronaxie; dots: number } {
    if (ev.chronaxie) return {chronaxie: ev.chronaxie, dots: Math.min(3, ev.dots)}
    if (ev.dur > EPS) return fromUnits(ev.dur)
    return {chronaxie: 64, dots: 0}
}

function clampRegion(region: number): number {
    if (!Number.isFinite(region)) return 0
    return Math.max(-40, Math.min(50, Math.round(region)))
}

type Pos = { mi: number; onset: number; seq: number }

function comparePos(a: Pos, b: Pos): number {
    if (a.mi !== b.mi) return a.mi - b.mi
    if (Math.abs(a.onset - b.onset) > EPS) return a.onset - b.onset
    return a.seq - b.seq
}

type LinkPoint = { key: string; type: 'start' | 'stop'; pos: Pos; id: string }

type SpanKind = 'wedge' | 'pedal' | 'octave' | 'trill'
type SpanPoint = {
    kind: SpanKind
    key: string
    type: 'start' | 'stop'
    pos: Pos
    staff: number
    /** 直接锚定的 slot（颤音线起止在音符上） */
    slotId?: string
    line?: boolean
    crescendo?: boolean
    up?: boolean
    size?: number
}

type DynamicPoint = { staff: number; pos: Pos; name: SingleNoteAffiliatedSymbolNameEnum }

type TimelineEntry = { mi: number; onset: number; slot: MeasureNoteSlot }

type StaffState = {
    clef: ClefTypeEnum
    octaveChange: number
    fifths: number
    beats: number
    beatType: number
    timeType?: TimeSignatureTypeEnum
    /** 八度记号造成的谱面下移（region） */
    octaveShift: number
}

type MeasureHeader = {
    clef: ClefTypeEnum
    fifths: number
    clefChanged: boolean
    keyChanged: boolean
    timeChanged: boolean
    timeType?: TimeSignatureTypeEnum
}

type StaffDef = { partIndex: number; local: number; name: string }

function wholeRestMeasure(measure: Measure, length: number, capacity: number): TimelineEntry[] {
    const list = getMeasureNoteList(measure)
    list.length = 0
    const entries: TimelineEntry[] = []
    if (length <= EPS || Math.abs(length - capacity) < EPS) {
        const slot = createNoteRest({chronaxie: 256})
        list.push(slot)
        entries.push({mi: -1, onset: 0, slot})
        return entries
    }
    let onset = 0
    for (const c of splitRests(length)) {
        const slot = createNoteRest({chronaxie: c})
        list.push(slot)
        entries.push({mi: -1, onset, slot})
        onset += c
    }
    return entries
}

function setBeam(sym: NoteSymbol, beam: BeamTypeEnum) {
    for (const info of sym.notesInfo) info.beamType = beam
}

/** 保证符杠首尾成对：Combined 前必须有可连的音，OnlyRight 后必须接 Combined */
function fixBeams(slots: MeasureNoteSlot[]) {
    const syms = slots.map((s) => slotSymbol(s))
    let prevBeamable = false
    for (const sym of syms) {
        if (isNoteRest(sym) || !('notesInfo' in sym) || !sym.notesInfo.length) {
            prevBeamable = false
            continue
        }
        const note = sym as NoteSymbol
        const lead = note.notesInfo[0]!
        let beam = lead.beamType
        if (lead.chronaxie >= 64) beam = BeamTypeEnum.None
        else if (beam === BeamTypeEnum.Combined && !prevBeamable) beam = BeamTypeEnum.OnlyRight
        setBeam(note, beam)
        prevBeamable = beam !== BeamTypeEnum.None
    }
    for (let i = 0; i < syms.length; i++) {
        const sym = syms[i]!
        if (isNoteRest(sym) || !('notesInfo' in sym)) continue
        const note = sym as NoteSymbol
        if (note.notesInfo[0]?.beamType !== BeamTypeEnum.OnlyRight) continue
        const next = syms[i + 1]
        const nextBeam = next && !isNoteRest(next) && 'notesInfo' in next ? (next as NoteSymbol).notesInfo[0]?.beamType : undefined
        if (nextBeam !== BeamTypeEnum.Combined) setBeam(note, BeamTypeEnum.None)
    }
    for (const sym of syms) {
        if (isNoteRest(sym) || !('graceNotes' in sym)) continue
        for (const list of [sym.graceNotes, sym.graceNotesAfter]) {
            if (!list?.length) continue
            const beamable = list.length > 1 && list.every((g) => g.chronaxie < 64)
            list.forEach((g, i) => {
                g.beamType = !beamable ? BeamTypeEnum.None : i === 0 ? BeamTypeEnum.OnlyRight : BeamTypeEnum.Combined
            })
        }
    }
}

function emptyScore(warnings: string[], options: XmlToMusicScoreOptions): XmlToMusicScoreResult {
    const score = createMusicScore({
        type: MusicScoreTypeEnum.StandardStaff,
        width: options.width ?? 1000,
        height: 200,
        topSpaceHeight: TOP_SPACE_HEIGHT,
    })
    const gs = createGrandStaff({withDefaultStaff: false})
    const staff = createSingleStaff({withDefaultMeasure: false})
    const measure = createMeasure({clef: ClefTypeEnum.Treble, keySignature: KeySignatureTypeEnum.C})
    getMeasureNoteList(measure).push(createNoteRest({chronaxie: 256}))
    staff.measures.push(measure)
    gs.staves.push(staff)
    score.grandStaffs.push(gs)
    return {musicScore: score, warnings}
}

function estimateLineHeight(staffCount: number, lyricLines: number): number {
    const {uSpace, dSpace} = DEFAULT_SPACING.grandStaff
    const {uSpaceI, dSpaceI, uSpaceO, dSpaceO} = DEFAULT_SPACING.singleStaff
    return uSpace + dSpace + lyricLines * 20
        + staffCount * (DEFAULT_MEASURE_HEIGHT + uSpaceI + dSpaceI + uSpaceO + dSpaceO)
}

class ScoreBuilder {
    readonly warnings: string[]
    readonly staffDefs: StaffDef[] = []
    /** 各 part 第一个谱表的全局下标 */
    readonly partOffset: number[] = []
    readonly measures: Measure[][] = []
    readonly headers: MeasureHeader[][] = []
    readonly timelines: TimelineEntry[][] = []
    readonly states: StaffState[] = []
    readonly links: LinkPoint[] = []
    readonly spans: SpanPoint[] = []
    readonly dynamics: DynamicPoint[] = []
    readonly measureCount: number
    droppedVoiceNotes = 0
    tupletMeasures = 0
    unsupportedTime = new Set<string>()
    maxLyricLines = 0

    constructor(readonly ir: ScoreIR) {
        this.warnings = ir.warnings
        ir.parts.forEach((part, pi) => {
            this.partOffset.push(this.staffDefs.length)
            for (let s = 1; s <= part.staves; s++) {
                this.staffDefs.push({partIndex: pi, local: s, name: s === 1 ? part.name : ''})
                this.measures.push([])
                this.headers.push([])
                this.timelines.push([])
                this.states.push({
                    clef: s === 2 ? ClefTypeEnum.Bass : ClefTypeEnum.Treble,
                    octaveChange: 0,
                    fifths: 0,
                    beats: 4,
                    beatType: 4,
                    octaveShift: 0,
                })
            }
        })
        this.measureCount = Math.max(0, ...ir.parts.map((p) => p.measures.length))
    }

    build() {
        for (let mi = 0; mi < this.measureCount; mi++) {
            this.ir.parts.forEach((part, pi) => {
                const m = part.measures[mi]
                if (m?.events.some((e) => e.kind === 'note' && e.tuplet)) this.tupletMeasures++
                for (let s = 1; s <= part.staves; s++) {
                    const g = this.partOffset[pi]! + s - 1
                    try {
                        this.buildStaffMeasure(part, pi, s, g, m, mi)
                    } catch (e) {
                        this.warnings.push(`第 ${mi + 1} 小节（谱表 ${g + 1}）解析失败，已用休止符代替：${(e as Error)?.message ?? e}`)
                        const measure = this.measures[g]![mi] ?? createMeasure({})
                        this.measures[g]![mi] = measure
                        const state = this.states[g]!
                        wholeRestMeasure(measure, 0, 256)
                        this.headers[g]![mi] ??= {
                            clef: state.clef, fifths: state.fifths,
                            clefChanged: mi === 0, keyChanged: mi === 0, timeChanged: mi === 0,
                            ...(state.timeType ? {timeType: state.timeType} : {}),
                        }
                    }
                }
                if (m) this.applyBarlines(m, pi, mi)
            })
        }
    }

    private buildStaffMeasure(part: PartIR, pi: number, s: number, g: number, m: MeasureIR | undefined, mi: number) {
        const state = this.states[g]!
        const measure = createMeasure({})
        this.measures[g]![mi] = measure
        const events = m?.events ?? []

        // —— 小节头：onset=0 的谱号 / 调号 / 拍号 ——
        const prevClef = state.clef
        const prevFifths = state.fifths
        const prevTime = `${state.beats}/${state.beatType}/${state.timeType}`
        const midClefs: { onset: number; seq: number; clef: ClefTypeEnum; octaveChange: number }[] = []
        for (const ev of events) {
            if (ev.kind === 'clef' && ev.staff === s) {
                if (ev.onset < EPS) {
                    state.clef = ev.clef
                    state.octaveChange = ev.octaveChange
                } else {
                    midClefs.push(ev)
                }
            } else if (ev.kind === 'key' && (ev.staff == null || ev.staff === s)) {
                state.fifths = ev.fifths
            } else if (ev.kind === 'time' && (ev.staff == null || ev.staff === s)) {
                state.beats = ev.beats
                state.beatType = ev.beatType
                if (ev.type) state.timeType = ev.type
                else {
                    delete state.timeType
                    this.unsupportedTime.add(`${ev.beats}/${ev.beatType}`)
                }
            }
        }
        const header: MeasureHeader = {
            clef: state.clef,
            fifths: state.fifths,
            clefChanged: mi === 0 || state.clef !== prevClef,
            keyChanged: mi === 0 || state.fifths !== prevFifths,
            timeChanged: mi === 0 || prevTime !== `${state.beats}/${state.beatType}/${state.timeType}`,
            ...(state.timeType ? {timeType: state.timeType} : {}),
        }
        this.headers[g]![mi] = header

        const capacity = state.beats * (256 / state.beatType)
        const measureLen = m && m.length > EPS ? m.length : capacity
        const headerClef = {clef: state.clef, octaveChange: state.octaveChange}
        midClefs.sort((a, b) => a.onset - b.onset || a.seq - b.seq)
        const clefAt = (ev: NoteEv) => {
            let cur = headerClef
            for (const c of midClefs) {
                if (c.onset < ev.onset - EPS || (Math.abs(c.onset - ev.onset) < EPS && c.seq < ev.seq)) cur = c
            }
            return cur
        }

        // —— 方向记号：力度 / 渐强渐弱 / 踏板 / 八度 ——
        const shiftChanges: { onset: number; seq: number; shift: number }[] = []
        let shift = state.octaveShift
        for (const ev of events) {
            if (ev.kind !== 'dir' || ev.staff !== s) continue
            const pos = {mi, onset: ev.onset, seq: ev.seq}
            const d = ev.dir
            if (d.t === 'dynamic') {
                this.dynamics.push({staff: g, pos, name: d.name})
            } else if (d.t === 'wedge') {
                this.spans.push({
                    kind: 'wedge', key: `${pi}|w${d.number}`, type: d.type, pos, staff: g,
                    ...(d.line ? {line: true} : {}), ...(d.crescendo ? {crescendo: true} : {}),
                })
            } else if (d.t === 'pedal') {
                if (d.type !== 'start') this.spans.push({kind: 'pedal', key: `${pi}|pedal`, type: 'stop', pos, staff: g})
                if (d.type !== 'stop') {
                    this.spans.push({kind: 'pedal', key: `${pi}|pedal`, type: 'start', pos: {...pos, seq: pos.seq + 0.5}, staff: g})
                }
            } else if (d.t === 'octave') {
                const size = d.size === 15 ? 2 : d.size === 22 ? 3 : 1
                shift = d.type === 'start' ? (d.up ? 7 : -7) * size : 0
                shiftChanges.push({onset: ev.onset, seq: ev.seq, shift})
                this.spans.push({
                    kind: 'octave', key: `${pi}|${s}|o${d.number}`, type: d.type, pos, staff: g,
                    ...(d.up ? {up: true} : {}), ...(d.size ? {size: d.size} : {}),
                })
            } else if (d.t === 'startRepeat' && g === 0) {
                measure.startRepeat = createMeasureStartRepeat(d.value)
            } else if (d.t === 'endRepeat' && g === 0) {
                measure.endRepeat = createMeasureEndRepeat(d.value)
            }
        }
        const shiftBase = state.octaveShift
        const shiftAt = (ev: NoteEv) => {
            let cur = shiftBase
            for (const c of shiftChanges) {
                if (c.onset < ev.onset - EPS || (Math.abs(c.onset - ev.onset) < EPS && c.seq < ev.seq)) cur = c.shift
            }
            return cur
        }
        state.octaveShift = shift

        const regionOf = (ev: NoteEv): number => {
            const {clef, octaveChange} = clefAt(ev)
            const anchor = CLEF_ANCHOR[clef] ?? CLEF_ANCHOR[ClefTypeEnum.Treble]
            const anchorOctave = Math.floor(anchor.startMidi / 12) - 1
            const stepIndex = Math.max(0, DIATONIC_LETTERS.indexOf((ev.step ?? 'C') as typeof DIATONIC_LETTERS[number]))
            return clampRegion(
                anchor.startRegion + ((ev.octave ?? 4) - anchorOctave) * 7 + stepIndex - octaveChange * 7 - shiftAt(ev),
            )
        }

        const notes = events.filter((e): e is NoteEv => e.kind === 'note' && e.staff === s)
        /** 输出的每个音 → 来源音符；变音在小节组装完后按实际输出的音重算 */
        const sourceOf = new Map<NotesInfo, NoteEv>()

        const beamOf = (ev: NoteEv): BeamTypeEnum => {
            if (!part.hasBeams) return BeamTypeEnum.None
            if (ev.beam === 'begin') return BeamTypeEnum.OnlyRight
            if (ev.beam === 'continue' || ev.beam === 'end') return BeamTypeEnum.Combined
            return BeamTypeEnum.None
        }
        const infoOptions = (ev: NoteEv, grace = false): CreateNotesInfoOptions => {
            const {chronaxie, dots} = grace ? {chronaxie: ev.chronaxie ?? 32, dots: 0} : displayOf(ev)
            return {
                region: regionOf(ev),
                chronaxie,
                beamType: grace ? BeamTypeEnum.None : beamOf(ev),
                ...(ev.stem ? {direction: ev.stem} : {}),
                ...(dots > 0 ? {augmentationDot: Math.min(3, dots) as 1 | 2 | 3} : {}),
            }
        }
        const register = (ev: NoteEv, info: NotesInfo, slot: MeasureNoteSlot) => {
            const pos = {mi, onset: ev.onset, seq: ev.seq}
            if (ev.step && !ev.rest && !sourceOf.has(info)) sourceOf.set(info, ev)
            for (const name of ev.marks) {
                (info.affiliatedSymbols ??= []).push({...ZERO_FRAME, id: newId(), name, data: {}})
            }
            if (ev.step) {
                const tieKey = `${pi}|${ev.step}${Math.round(ev.alter)}${ev.octave}`
                if (ev.tieStop) this.links.push({key: tieKey, type: 'stop', pos, id: info.id})
                if (ev.tieStart) this.links.push({key: tieKey, type: 'start', pos: {...pos, seq: pos.seq + 0.5}, id: info.id})
            }
            for (const sl of ev.slurs) {
                this.links.push({
                    key: `${pi}|slur${sl.number}`,
                    type: sl.type as 'start' | 'stop',
                    pos: sl.type === 'start' ? {...pos, seq: pos.seq + 0.5} : pos,
                    id: info.id,
                })
            }
            for (const w of ev.wavy) {
                this.spans.push({kind: 'trill', key: `${pi}|t${w.number}`, type: w.type as 'start' | 'stop', pos, staff: g, slotId: slot.id})
            }
            if (ev.arpeggio && !slot.affiliatedSymbols?.length) slot.affiliatedSymbols = [createArpeggio()]
            if (ev.lyrics.length) {
                const lines = slot.lyrics.length === 1 && !slot.lyrics[0]!.text ? [] : [...slot.lyrics]
                for (const l of ev.lyrics) {
                    const idx = Number(l.key)
                    while (lines.length <= idx) lines.push(createLyrics(''))
                    if (!lines[idx]!.text) lines[idx] = createLyrics(l.text)
                }
                slot.lyrics = lines
                this.maxLyricLines = Math.max(this.maxLyricLines, lines.length)
            }
        }
        const makeNote = (ev: NoteEv, graces: NoteEv[]): MeasureNoteSlot => {
            const slot = createNoteSymbol({
                notesInfo: [infoOptions(ev)],
                ...(graces.length ? {graceNotes: graces.map((gEv) => infoOptions(gEv, true))} : {}),
            })
            const sym = slotSymbol(slot) as NoteSymbol
            register(ev, sym.notesInfo[0]!, slot)
            graces.forEach((gEv, i) => {
                const info = sym.graceNotes?.[i]
                if (info) register({...gEv, lyrics: [], arpeggio: false}, info, slot)
            })
            return slot
        }
        const addChordTone = (slot: MeasureNoteSlot, ev: NoteEv) => {
            const sym = slotSymbol(slot) as NoteSymbol
            const opts = infoOptions(ev)
            const same = sym.notesInfo.find((i) => i.region === opts.region)
            if (same) {
                register(ev, same, slot)
                return
            }
            const info = createNotesInfo({...opts, beamType: sym.notesInfo[0]?.beamType ?? opts.beamType})
            sym.notesInfo.push(info)
            register(ev, info, slot)
        }
        const attachGraceAfter = (slot: MeasureNoteSlot | undefined, graces: NoteEv[]) => {
            if (!slot || !graces.length) return
            const sym = slotSymbol(slot) as NoteSymbol
            const list = (sym.graceNotesAfter ??= [])
            for (const gEv of graces) {
                const info = createNotesInfo(infoOptions(gEv, true))
                list.push(info)
                register({...gEv, lyrics: [], arpeggio: false}, info, slot)
            }
        }

        // —— 主声部：音符最多的声部（并列取编号小的） ——
        const voiceScore = new Map<string, number>()
        for (const ev of notes) {
            if (ev.grace) continue
            voiceScore.set(ev.voice, (voiceScore.get(ev.voice) ?? 0) + (ev.rest || ev.hidden ? 0.001 : 1))
        }
        const voices = [...voiceScore.keys()].sort((a, b) =>
            (voiceScore.get(b)! - voiceScore.get(a)!) || (Number(a) - Number(b)) || a.localeCompare(b))
        const primary = voices[0]

        const slots = getMeasureNoteList(measure)
        const timeline: TimelineEntry[] = []
        let cursor = 0
        const pushRests = (from: number, to: number) => {
            let onset = from
            for (const c of splitRests(to - from)) {
                const slot = createNoteRest({chronaxie: c})
                slots.push(slot)
                timeline.push({mi, onset, slot})
                onset += c
            }
        }
        let pendingGrace: NoteEv[] = []
        let lastNote: MeasureNoteSlot | undefined
        /** 只有休止且含整小节休止：不按时间排（有的导出器漏写 <backup>，休止会被推到小节外） */
        const restOnly = notes.some((e) => e.measureRest) && notes.every((e) => e.rest)
        for (const ev of notes) {
            if (restOnly) break
            if (ev.voice !== primary) continue
            if (ev.grace) {
                if (!ev.chord && ev.step && !ev.rest) pendingGrace.push(ev)
                continue
            }
            if (ev.chord) {
                const last = timeline[timeline.length - 1]
                if (last && last.slot === lastNote && Math.abs(last.onset - ev.onset) < EPS && ev.step && !ev.rest) {
                    addChordTone(last.slot, ev)
                }
                continue
            }
            if (ev.onset > cursor + EPS) pushRests(cursor, ev.onset)
            let slot: MeasureNoteSlot
            if (ev.rest || !ev.step) {
                const {chronaxie, dots} = ev.measureRest ? {chronaxie: 256 as Chronaxie, dots: 0} : displayOf(ev)
                slot = createNoteRest({chronaxie, ...(dots ? {augmentationDot: Math.min(3, dots) as 1 | 2 | 3} : {})})
                const rest = slotSymbol(slot) as NoteRest
                for (const name of ev.marks) (rest.affiliatedSymbols ??= []).push({...ZERO_FRAME, id: newId(), name, data: {}})
                attachGraceAfter(lastNote, pendingGrace)
            } else {
                slot = makeNote(ev, pendingGrace)
                lastNote = slot
            }
            pendingGrace = []
            slots.push(slot)
            timeline.push({mi, onset: ev.onset, slot})
            const {chronaxie, dots} = displayOf(ev)
            cursor = Math.max(cursor, ev.onset + (ev.dur > EPS ? ev.dur : ev.measureRest ? measureLen : dotted(chronaxie, dots)))
        }
        attachGraceAfter(lastNote, pendingGrace)
        if (!slots.length) {
            for (const e of wholeRestMeasure(measure, restOnly ? Math.min(measureLen, capacity) : measureLen, capacity)) timeline.push({...e, mi})
        } else if (cursor < measureLen - EPS) {
            pushRests(cursor, measureLen)
        }

        // —— 其它声部：同起点同时值的音并成和弦；主声部同位置是休止符时替换 ——
        for (let i = 0; i < notes.length; i++) {
            const head = notes[i]!
            if (head.voice === primary || head.grace || head.chord || head.hidden) continue
            const group = [head]
            while (notes[i + 1]?.chord && notes[i + 1]!.voice === head.voice) group.push(notes[++i]!)
            const tones = group.filter((e) => e.step && !e.rest)
            if (!tones.length) continue
            const want = displayOf(head)
            const idx = timeline.findIndex((t) => Math.abs(t.onset - head.onset) < EPS)
            const entry = timeline[idx]
            const sym = entry ? slotSymbol(entry.slot) : undefined
            const symDisplay = sym && isNoteRest(sym)
                ? {chronaxie: sym.chronaxie, dots: sym.augmentationDot?.count ?? 0}
                : sym ? {chronaxie: (sym as NoteSymbol).notesInfo[0]?.chronaxie, dots: (sym as NoteSymbol).notesInfo[0]?.augmentationDot?.count ?? 0} : undefined
            const sameLength = symDisplay && symDisplay.chronaxie === want.chronaxie && symDisplay.dots === want.dots
            if (!entry || !sym || !sameLength) {
                this.droppedVoiceNotes += tones.length
                continue
            }
            if (isNoteRest(sym)) {
                const slot = makeNote(tones[0]!, [])
                for (const t of tones.slice(1)) addChordTone(slot, t)
                const at = slots.indexOf(entry.slot)
                if (at >= 0) slots[at] = slot
                entry.slot = slot
            } else {
                for (const t of tones) addChordTone(entry.slot, t)
            }
        }

        // —— 小节中间换谱号：挂到其后第一个音符位，没有则作为后置谱号 ——
        for (const c of midClefs) {
            const entry = timeline.find((t) => t.onset >= c.onset - EPS)
            const sym = entry ? slotSymbol(entry.slot) as NoteSymbol | NoteRest : undefined
            if (sym && !sym.clef && c.onset < measureLen - EPS) sym.clef = createClef(c.clef)
            else measure.clef_b = createClef(c.clef)
            state.clef = c.clef
            state.octaveChange = c.octaveChange
        }

        // —— 符杠：原谱没有 <beam> 时按拍自动成组 ——
        if (!part.hasBeams) {
            const beat = state.beatType === 8 && state.beats % 3 === 0 && state.beats > 3 ? 96 : 64
            for (const t of timeline) {
                const sym = slotSymbol(t.slot)
                if (isNoteRest(sym)) continue
                const note = sym as NoteSymbol
                setBeam(note, resolveAutoBeamType(t.onset, note.notesInfo[0]?.chronaxie ?? 64, beat))
            }
        }
        fixBeams(slots)

        // —— 变音：按输出顺序走调号 + 小节内记忆（被丢弃的声部可能带走了前面的变音），原谱显式记号作提醒保留 ——
        const memory = new Map<number, number>()
        for (const slot of slots) {
            const sym = slotSymbol(slot)
            if (isNoteRest(sym)) continue
            const note = sym as NoteSymbol
            for (const info of [...(note.graceNotes ?? []), ...note.notesInfo, ...(note.graceNotesAfter ?? [])]) {
                const ev = sourceOf.get(info)
                if (!ev?.step) continue
                const alter = Math.round(ev.alter)
                const expected = memory.get(info.region) ?? keyAlter(ev.step, state.fifths)
                const acc = (ev.accidental ? ACCIDENTAL_TEXT[ev.accidental] : undefined)
                    ?? (!ev.tieStop && alter !== expected ? alterToAccidental(alter) : undefined)
                if (acc) info.accidental = createAccidental(acc)
                else delete info.accidental
                memory.set(info.region, alter)
            }
        }
        this.timelines[g]!.push(...timeline)
    }

    private applyBarlines(m: MeasureIR, pi: number, mi: number) {
        const part = this.ir.parts[pi]!
        for (let s = 1; s <= part.staves; s++) {
            const measure = this.measures[this.partOffset[pi]! + s - 1]![mi]
            if (!measure) continue
            const right = barlineType(m.barRight, 'right')
            if (right) measure.barline_b = createBarline(right)
            if (m.barLeft?.repeat === 'forward') measure.barline_f = createBarline(BarlineTypeEnum.StartRepeat_barline)
        }
    }

    resolveLinks(score: MusicScore) {
        const byKey = new Map<string, LinkPoint[]>()
        for (const p of this.links) {
            if (!byKey.has(p.key)) byKey.set(p.key, [])
            byKey.get(p.key)!.push(p)
        }
        for (const list of byKey.values()) {
            list.sort((a, b) => comparePos(a.pos, b.pos))
            let open: LinkPoint | undefined
            for (const p of list) {
                if (p.type === 'start') {
                    open = p
                } else if (open) {
                    if (open.id !== p.id) score.affiliatedSymbols.push(createSlur({startId: open.id, endId: p.id}))
                    open = undefined
                }
            }
        }
    }

    private firstAtOrAfter(staff: number, pos: Pos): TimelineEntry | undefined {
        return this.timelines[staff]?.find((t) => t.mi > pos.mi || (t.mi === pos.mi && t.onset >= pos.onset - EPS))
    }

    private lastBefore(staff: number, pos: Pos): TimelineEntry | undefined {
        const list = this.timelines[staff] ?? []
        for (let i = list.length - 1; i >= 0; i--) {
            const t = list[i]!
            if (t.mi < pos.mi || (t.mi === pos.mi && t.onset < pos.onset - EPS)) return t
        }
        return undefined
    }

    resolveDynamics() {
        for (const d of this.dynamics) {
            const entry = this.firstAtOrAfter(d.staff, d.pos) ?? this.lastBefore(d.staff, d.pos)
            if (!entry) continue
            const sym = slotSymbol(entry.slot)
            const holder = isNoteRest(sym) ? (sym as NoteRest) : (sym as NoteSymbol).notesInfo[0]
            if (!holder) continue
            const list = (holder.affiliatedSymbols ??= [])
            if (!list.some((a) => a.name === d.name)) list.push({...ZERO_FRAME, id: newId(), name: d.name, data: {}})
        }
    }

    resolveSpans(score: MusicScore) {
        const byKey = new Map<string, SpanPoint[]>()
        for (const p of this.spans) {
            if (!byKey.has(p.key)) byKey.set(p.key, [])
            byKey.get(p.key)!.push(p)
        }
        const indexOf = (staff: number, slotId: string) => this.timelines[staff]!.findIndex((t) => t.slot.id === slotId)
        const create = (start: SpanPoint, endSlotId: string | undefined) => {
            const startEntry = start.slotId
                ? this.timelines[start.staff]![indexOf(start.staff, start.slotId)]
                : this.firstAtOrAfter(start.staff, start.pos)
            if (!startEntry) return
            const startId = startEntry.slot.id
            let endId = endSlotId ?? startId
            if (indexOf(start.staff, endId) < indexOf(start.staff, startId)) endId = startId
            switch (start.kind) {
                case 'wedge':
                    score.affiliatedSymbols.push(createHairpin({
                        startId, endId,
                        type: start.line
                            ? start.crescendo ? HairpinTypeEnum.Crescendo_line : HairpinTypeEnum.Diminuendo_line
                            : start.crescendo ? HairpinTypeEnum.Crescendo_hairpin : HairpinTypeEnum.Diminuendo_hairpin,
                    }))
                    break
                case 'pedal':
                    score.affiliatedSymbols.push(createPedal({startId, endId}))
                    break
                case 'octave':
                    score.affiliatedSymbols.push(createPitch({
                        startId, endId,
                        direction: start.up ? 'up' : 'down',
                        type: start.size === 15 ? PitchTypeEnum['15ma'] : start.size === 22 ? PitchTypeEnum['22ma'] : PitchTypeEnum['8va'],
                    }))
                    break
                case 'trill':
                    score.affiliatedSymbols.push(createTrill({startId, endId}))
                    break
            }
        }
        for (const list of byKey.values()) {
            list.sort((a, b) => comparePos(a.pos, b.pos))
            let open: SpanPoint | undefined
            for (const p of list) {
                if (p.type === 'start') {
                    if (open && open.kind !== 'wedge') create(open, this.lastBefore(open.staff, p.pos)?.slot.id)
                    open = p
                    continue
                }
                if (!open) continue
                const end = p.slotId ?? this.lastBefore(open.staff, p.pos)?.slot.id
                create(open, end)
                open = undefined
            }
            if (open && open.kind !== 'wedge') {
                const tl = this.timelines[open.staff]!
                create(open, tl[tl.length - 1]?.slot.id)
            }
        }
    }

    resolveVoltas(score: MusicScore) {
        const first = this.ir.parts[0]
        const top = this.measures[0]
        if (!first || !top) return
        let open: { mi: number; number: string; text?: string } | undefined
        const close = (endMi: number) => {
            if (!open) return
            const start = top[open.mi]
            const end = top[Math.max(open.mi, endMi)]
            if (start && end) {
                const nums = open.number.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0)
                score.affiliatedSymbols.push(createVolta({
                    startId: start.id,
                    endId: end.id,
                    text: open.text || (nums.length ? nums.map((n) => `${n}.`).join(' ') : `${open.number}.`),
                    value: nums.length ? nums.map((n) => n - 1) : [0],
                }))
            }
            open = undefined
        }
        first.measures.forEach((m, mi) => {
            for (const e of m.endings) {
                if (e.type === 'start') {
                    close(mi - 1)
                    open = {mi, number: e.number, ...(e.text ? {text: e.text} : {})}
                } else if (e.type === 'stop' || e.type === 'discontinue') {
                    close(mi)
                }
            }
        })
        close(this.measureCount - 1)
    }

    lineStarts(options: XmlToMusicScoreOptions): number[] {
        const perLine = Math.max(1, options.measuresPerLine ?? 4)
        const maxPerLine = Math.max(perLine, options.maxMeasuresPerLine ?? 8)
        const breaks = (this.ir.parts[0]?.measures ?? [])
            .map((m, mi) => (m.newSystem && mi > 0 ? mi : -1))
            .filter((mi) => mi > 0)
        const starts: number[] = []
        if (!breaks.length) {
            for (let mi = 0; mi < this.measureCount; mi += perLine) starts.push(mi)
            return starts
        }
        const bounds = [0, ...breaks, this.measureCount]
        for (let i = 0; i < bounds.length - 1; i++) {
            const from = bounds[i]!
            const to = bounds[i + 1]!
            if (to <= from) continue
            const pieces = to - from > maxPerLine ? Math.ceil((to - from) / maxPerLine) : 1
            for (let k = 0; k < pieces; k++) starts.push(from + Math.round((k * (to - from)) / pieces))
        }
        return starts
    }

    applyHeaders(lineStarts: Set<number>) {
        this.measures.forEach((list, g) => {
            list.forEach((measure, mi) => {
                const h = this.headers[g]![mi]
                if (!h) return
                const lineStart = lineStarts.has(mi)
                if (lineStart || h.clefChanged) measure.clef_f = createClef(h.clef)
                if (lineStart || h.keyChanged) measure.keySignature_f = createKeySignature(FIFTHS_TO_KEY[h.fifths] ?? KeySignatureTypeEnum.C)
                if (h.timeChanged && h.timeType) measure.timeSignature_f = createTimeSignature(h.timeType)
                // 反复记号 end + 下一小节 start（不在行首）合成一根
                const next = list[mi + 1]
                if (measure.barline_b?.type === BarlineTypeEnum.EndRepeat_barline
                    && next?.barline_f?.type === BarlineTypeEnum.StartRepeat_barline
                    && !lineStarts.has(mi + 1)) {
                    measure.barline_b = createBarline(BarlineTypeEnum.Start_end_repeat_barline)
                    delete next.barline_f
                }
            })
        })
    }
}

function barlineType(bar: BarlineIR | undefined, side: 'left' | 'right'): BarlineTypeEnum | undefined {
    if (!bar) return undefined
    if (side === 'right' && bar.repeat === 'backward') return BarlineTypeEnum.EndRepeat_barline
    return bar.style ? BAR_STYLE[bar.style] : undefined
}

/** 去掉指向不存在对象的附属符号，保证渲染安全 */
function sanitize(score: MusicScore) {
    const infoIds = new Set<string>()
    const slotIds = new Set<string>()
    const measureIds = new Set<string>()
    for (const gs of score.grandStaffs) {
        for (const staff of gs.staves) {
            for (const measure of staff.measures) {
                measureIds.add(measure.id)
                if (!getMeasureSlots(measure).length) getMeasureNoteList(measure).push(createNoteRest({chronaxie: 256}))
                for (const slot of getMeasureSlots(measure)) {
                    slotIds.add(slot.id)
                    const sym = slotSymbol(slot)
                    if (isNoteRest(sym) || !('notesInfo' in sym)) continue
                    const note = sym as NoteSymbol
                    for (const list of [note.notesInfo, note.graceNotes ?? [], note.graceNotesAfter ?? []]) {
                        for (const info of list) infoIds.add(info.id)
                    }
                }
            }
        }
    }
    score.affiliatedSymbols = score.affiliatedSymbols.filter((sym) => {
        const ids = 'data' in sym && sym.data && 'volta' in sym.data ? measureIds
            : 'data' in sym && sym.data && 'slur' in sym.data ? infoIds
                : slotIds
        if (!ids.has(sym.startId) || !ids.has(sym.endId)) return false
        return !(ids === infoIds && sym.startId === sym.endId)
    })
}

/** MusicXML（getXmlJson 结果）→ 五线谱 MusicScore，附带警告；无法识别的符号会被跳过，不会抛错 */
export function xmlToMusicScoreWithWarnings(xmlData: unknown, options: XmlToMusicScoreOptions = {}): XmlToMusicScoreResult {
    const ir = readScoreIR(xmlData)
    if (!ir) throw new Error('不是 MusicXML 乐谱：缺少 <score-partwise> 或 <score-timewise>')
    if (!ir.parts.length) {
        ir.warnings.push('乐谱中没有任何声部（part）')
        return emptyScore(ir.warnings, options)
    }

    const builder = new ScoreBuilder(ir)
    builder.build()
    const lineStarts = builder.lineStarts(options)
    builder.applyHeaders(new Set(lineStarts))

    const staffCount = builder.staffDefs.length
    const score = createMusicScore({
        type: MusicScoreTypeEnum.StandardStaff,
        title: ir.title,
        bpm: ir.bpm ?? 120,
        beatUnit: 4,
        width: options.width ?? 1000,
        height: TOP_SPACE_HEIGHT + lineStarts.length * estimateLineHeight(staffCount, builder.maxLyricLines),
        topSpaceHeight: TOP_SPACE_HEIGHT,
    })
    if (ir.subTitle) score.subTitle = ir.subTitle
    if (ir.author) score.author = ir.author

    for (const step of [
        () => builder.resolveLinks(score),
        () => builder.resolveDynamics(),
        () => builder.resolveSpans(score),
        () => builder.resolveVoltas(score),
    ]) {
        try {
            step()
        } catch (e) {
            ir.warnings.push(`附属符号解析失败：${(e as Error)?.message ?? e}`)
        }
    }

    const bracketType = staffCount < 2 ? undefined : ir.parts.length === 1 ? BracketTypeEnum.Brace : BracketTypeEnum.Bracket
    lineStarts.forEach((start, i) => {
        const end = lineStarts[i + 1] ?? builder.measureCount
        const gs = createGrandStaff({
            withDefaultStaff: false,
            ...(bracketType ? {bracket: createBracket(bracketType, 0)} : {}),
        })
        builder.staffDefs.forEach((def, g) => {
            const staff: SingleStaff = createSingleStaff({
                withDefaultMeasure: false,
                ...(def.name ? {data: {instrumentName: def.name}} : {}),
            })
            staff.measures = builder.measures[g]!.slice(start, end)
            gs.staves.push(staff)
        })
        score.grandStaffs.push(gs)
    })

    sanitize(score)

    if (builder.droppedVoiceNotes) {
        ir.warnings.push(`五线谱每个谱表只保留一个声部：与主声部节奏不同的 ${builder.droppedVoiceNotes} 个音已省略`)
    }
    if (builder.tupletMeasures) {
        ir.warnings.push(`${builder.tupletMeasures} 个小节含连音（三连音等），暂按记谱时值显示`)
    }
    if (builder.unsupportedTime.size) {
        ir.warnings.push(`不支持的拍号 ${[...builder.unsupportedTime].join('、')}，未显示拍号`)
    }
    return {musicScore: score, warnings: ir.warnings}
}

/** MusicXML（getXmlJson 结果）→ 五线谱 MusicScore */
export function xmlToMusicScore(xmlData: unknown, options: XmlToMusicScoreOptions = {}): MusicScore {
    return xmlToMusicScoreWithWarnings(xmlData, options).musicScore
}
