import {
    ClefTypeEnum,
    MeasureEndRepeatEnum,
    MeasureStartRepeatEnum,
    SingleNoteAffiliatedSymbolNameEnum as N,
    TimeSignatureTypeEnum,
    beatsToTimeSignatureType,
    timeSignatureSymbolToType,
    type Chronaxie,
} from '@deciphony/renderer'

/**
 * MusicXML（fast-xml-parser preserveOrder 结构）→ 中间结构。
 * 时间单位统一为 chronaxie 刻度：四分音符 = 64，全音符 = 256；不认识的节点直接跳过。
 */

export type XNode = Record<string, any>

export function tagOf(n: XNode | undefined): string | undefined {
    if (!n) return undefined
    for (const k of Object.keys(n)) if (k !== ':@') return k
    return undefined
}

export function kids(n: XNode | undefined): XNode[] {
    const t = tagOf(n)
    const v = t ? n![t] : undefined
    return Array.isArray(v) ? v : []
}

export function attr(n: XNode | undefined, name: string): string | undefined {
    const v = n?.[':@']?.['@_' + name]
    return v == null ? undefined : String(v)
}

function find(list: XNode[], tag: string): XNode | undefined {
    return list.find((n) => tag in n)
}

function findAll(list: XNode[], tag: string): XNode[] {
    return list.filter((n) => tag in n)
}

export function textOf(n: XNode | undefined): string {
    return kids(n).filter((c) => '#text' in c).map((c) => String(c['#text'])).join('')
}

function childText(list: XNode[], tag: string): string | undefined {
    const n = find(list, tag)
    return n ? textOf(n).trim() : undefined
}

function childNum(list: XNode[], tag: string): number | undefined {
    const t = childText(list, tag)
    if (t == null || t === '') return undefined
    const v = Number(t)
    return Number.isFinite(v) ? v : undefined
}

// —— 中间结构 ——

export type NoteEv = {
    kind: 'note'
    seq: number
    staff: number
    voice: string
    onset: number
    /** 实际占用时长（含连音缩放），用于推进时间轴 */
    dur: number
    /** 记谱时值（来自 type；缺省时按 dur 推算） */
    chronaxie?: Chronaxie
    dots: number
    rest: boolean
    measureRest: boolean
    hidden: boolean
    grace: boolean
    chord: boolean
    step?: string
    alter: number
    octave?: number
    accidental?: string
    stem?: 'up' | 'down'
    beam?: string
    tieStart: boolean
    tieStop: boolean
    slurs: { type: string; number: string }[]
    wavy: { type: string; number: string }[]
    marks: N[]
    arpeggio: boolean
    lyrics: { key: string; text: string }[]
    tuplet: boolean
}

export type ClefEv = { kind: 'clef'; seq: number; staff: number; onset: number; clef: ClefTypeEnum; octaveChange: number }
export type KeyEv = { kind: 'key'; seq: number; staff?: number; onset: number; fifths: number }
export type TimeEv = {
    kind: 'time'
    seq: number
    staff?: number
    onset: number
    beats: number
    beatType: number
    type?: TimeSignatureTypeEnum
}

export type Direction =
    | { t: 'dynamic'; name: N }
    | { t: 'wedge'; type: 'start' | 'stop'; line?: boolean; crescendo?: boolean; number: string }
    | { t: 'pedal'; type: 'start' | 'stop' | 'change' }
    | { t: 'octave'; type: 'start' | 'stop'; up?: boolean; size?: number; number: string }
    | { t: 'startRepeat'; value: MeasureStartRepeatEnum }
    | { t: 'endRepeat'; value: MeasureEndRepeatEnum }

export type DirEv = { kind: 'dir'; seq: number; staff: number; onset: number; dir: Direction }

export type MeasureEv = NoteEv | ClefEv | KeyEv | TimeEv | DirEv

export type BarlineIR = { style?: string; repeat?: 'forward' | 'backward' }
export type EndingIR = { number: string; type: string; text?: string }

export type MeasureIR = {
    number: string
    implicit: boolean
    newSystem: boolean
    events: MeasureEv[]
    /** 小节内容实际长度（各声部最远到达处） */
    length: number
    barLeft?: BarlineIR
    barRight?: BarlineIR
    endings: EndingIR[]
}

export type PartIR = {
    id: string
    name: string
    staves: number
    measures: MeasureIR[]
    hasBeams: boolean
}

export type ScoreIR = {
    title: string
    subTitle: string
    author: string
    bpm?: number
    parts: PartIR[]
    warnings: string[]
}

// —— 映射表 ——

const TYPE_TO_CHRONAXIE: Record<string, Chronaxie> = {
    maxima: 256, long: 256, breve: 256, whole: 256, half: 128, quarter: 64, eighth: 32,
    '16th': 16, '32nd': 8, '64th': 4, '128th': 2, '256th': 1, '512th': 1, '1024th': 1,
}

const ARTICULATION_MARK: Record<string, N> = {
    accent: N.Accent_above,
    'strong-accent': N.Marcato_above,
    staccato: N.Staccato_above,
    staccatissimo: N.Staccatissimo_above,
    spiccato: N.Staccatissimo_stroke_above,
    tenuto: N.Tenuto_above,
    'detached-legato': N.Loure_above,
    stress: N.Stress_above,
    unstress: N.Unstress_above,
    'breath-mark': N.Breath,
}

const ORNAMENT_MARK: Record<string, N> = {
    'trill-mark': N.Trill,
    turn: N.Turn,
    'delayed-turn': N.Turn,
    'inverted-turn': N.InvertedTurn,
    'delayed-inverted-turn': N.InvertedTurn,
    mordent: N.Mordent,
    'inverted-mordent': N.ShortTrill,
    shake: N.ShortTrill,
}

const TECHNICAL_MARK: Record<string, N> = {
    'up-bow': N.Up_bow,
    'down-bow': N.Down_bow,
    harmonic: N.Harmonic,
    'open-string': N.Open,
    stopped: N.Muted,
}

/** 两个记号同时出现时合成一个组合字形 */
const COMBINED_MARKS: [N, N, N][] = [
    [N.Accent_above, N.Staccato_above, N.Accent_staccato_above],
    [N.Marcato_above, N.Staccato_above, N.Marcato_staccato_above],
    [N.Marcato_above, N.Tenuto_above, N.Marcato_tenuto_above],
    [N.Tenuto_above, N.Accent_above, N.Tenuto_accent_above],
    [N.Tenuto_above, N.Staccato_above, N.Loure_above],
]

const DYNAMIC_MARK: Record<string, N> = {
    pppppp: N.PPP, ppppp: N.PPP, pppp: N.PPP, ppp: N.PPP, pp: N.PP, p: N.P, mp: N.MP, mf: N.MF,
    f: N.F, ff: N.FF, fff: N.FFF, ffff: N.FFF, fffff: N.FFF, ffffff: N.FFF,
    fp: N.FP, pf: N.PF, sf: N.SF, sfz: N.SFZ, sffz: N.SFFZ, sfp: N.SFP, sfpp: N.SFP,
    rfz: N.RFZ, rf: N.RF, fz: N.FZ,
}

export function dynamicMark(name: string): N | undefined {
    return DYNAMIC_MARK[name]
}

function combineMarks(marks: N[]): N[] {
    const out = [...new Set(marks)]
    for (const [a, b, c] of COMBINED_MARKS) {
        const ia = out.indexOf(a)
        const ib = out.indexOf(b)
        if (ia >= 0 && ib >= 0) {
            out.splice(Math.max(ia, ib), 1)
            out.splice(Math.min(ia, ib), 1, c)
        }
    }
    return out
}

export function xmlClef(sign: string | undefined, line: number | undefined): ClefTypeEnum {
    switch ((sign ?? 'G').toUpperCase()) {
        case 'F':
            return ClefTypeEnum.Bass
        case 'C':
            return (line ?? 3) >= 4 ? ClefTypeEnum.Tenor : ClefTypeEnum.Alto
        case 'PERCUSSION':
            return ClefTypeEnum.Percussion
        default:
            return ClefTypeEnum.Treble
    }
}

const END_REPEAT_WORDS: [RegExp, MeasureEndRepeatEnum][] = [
    [/d\.?\s*c\.?\s*al\s*fine/i, MeasureEndRepeatEnum.DC_al_fine],
    [/d\.?\s*c\.?\s*al\s*coda/i, MeasureEndRepeatEnum.DC_al_coda],
    [/d\.?\s*s\.?\s*al\s*fine/i, MeasureEndRepeatEnum.DS_al_fine],
    [/d\.?\s*s\.?\s*al\s*coda/i, MeasureEndRepeatEnum.DS_al_coda],
    [/^\s*(d\.\s*c\.|da\s*capo)/i, MeasureEndRepeatEnum.DC],
    [/^\s*(d\.\s*s\.|dal\s*segno)/i, MeasureEndRepeatEnum.DS],
    [/^\s*to\s*coda/i, MeasureEndRepeatEnum.To_coda],
    [/^\s*fine\s*$/i, MeasureEndRepeatEnum.Fine],
]

// —— 解析 ——

function findRoot(xmlData: unknown): { tag: 'score-partwise' | 'score-timewise'; children: XNode[] } | undefined {
    if (!Array.isArray(xmlData)) return undefined
    for (const node of xmlData as XNode[]) {
        const t = tagOf(node)
        if (t === 'score-partwise' || t === 'score-timewise') return {tag: t, children: kids(node)}
    }
    return undefined
}

/** score-timewise（measure > part）转成 partwise（part > measure） */
function timewiseToPartwise(children: XNode[]): XNode[] {
    const byPart = new Map<string, XNode[]>()
    const out = children.filter((n) => tagOf(n) !== 'measure')
    for (const m of findAll(children, 'measure')) {
        for (const p of findAll(kids(m), 'part')) {
            const id = attr(p, 'id') ?? 'P1'
            if (!byPart.has(id)) byPart.set(id, [])
            byPart.get(id)!.push({measure: kids(p), ':@': m[':@']})
        }
    }
    for (const [id, measures] of byPart) out.push({part: measures, ':@': {'@_id': id}})
    return out
}

function readMeta(children: XNode[], ir: ScoreIR) {
    const work = find(children, 'work')
    const workTitle = work ? childText(kids(work), 'work-title') : undefined
    const movementTitle = childText(children, 'movement-title')
    const credits: Record<string, string> = {}
    for (const credit of findAll(children, 'credit')) {
        const ck = kids(credit)
        const type = childText(ck, 'credit-type')
        const words = findAll(ck, 'credit-words').map((w) => textOf(w).trim()).filter(Boolean).join(' ')
        if (type && words && !credits[type]) credits[type] = words
    }
    const ident = find(children, 'identification')
    const composer = ident
        ? findAll(kids(ident), 'creator').find((c) => attr(c, 'type') === 'composer') ?? find(kids(ident), 'creator')
        : undefined
    ir.title = workTitle || movementTitle || credits.title || ''
    ir.subTitle = credits.subtitle || (workTitle && movementTitle && movementTitle !== workTitle ? movementTitle : '')
    ir.author = (composer ? textOf(composer).trim() : '') || credits.composer || ''
}

function readPartNames(children: XNode[]): Map<string, string> {
    const names = new Map<string, string>()
    const partList = find(children, 'part-list')
    for (const sp of findAll(kids(partList), 'score-part')) {
        const id = attr(sp, 'id')
        if (!id) continue
        names.set(id, (childText(kids(sp), 'part-name') ?? '').replace(/\s+/g, ' ').trim())
    }
    return names
}

type PartCtx = {
    divisions: number
    seq: number
    staves: number
    hasBeams: boolean
    lyricKeys: string[]
}

function toUnits(div: number, ctx: PartCtx): number {
    return (div / ctx.divisions) * 64
}

function readNote(node: XNode, onsetDiv: number, ctx: PartCtx): NoteEv {
    const c = kids(node)
    const ev: NoteEv = {
        kind: 'note',
        seq: ctx.seq++,
        staff: Math.max(1, Math.round(childNum(c, 'staff') ?? 1)),
        voice: childText(c, 'voice') || '1',
        onset: toUnits(onsetDiv, ctx),
        dur: Math.max(0, toUnits(childNum(c, 'duration') ?? 0, ctx)),
        dots: findAll(c, 'dot').length,
        rest: false,
        measureRest: false,
        hidden: attr(node, 'print-object') === 'no',
        grace: !!find(c, 'grace'),
        chord: !!find(c, 'chord'),
        alter: 0,
        tieStart: false,
        tieStop: false,
        slurs: [],
        wavy: [],
        marks: [],
        arpeggio: false,
        lyrics: [],
        tuplet: !!find(c, 'time-modification'),
    }
    const type = childText(c, 'type')
    if (type && TYPE_TO_CHRONAXIE[type]) ev.chronaxie = TYPE_TO_CHRONAXIE[type]

    const rest = find(c, 'rest')
    if (rest) {
        ev.rest = true
        ev.measureRest = attr(rest, 'measure') === 'yes' || (!type && !ev.dots && !find(c, 'time-modification'))
    }
    const pitch = find(c, 'pitch')
    if (pitch) {
        const pc = kids(pitch)
        ev.step = childText(pc, 'step')?.toUpperCase()
        ev.alter = childNum(pc, 'alter') ?? 0
        ev.octave = childNum(pc, 'octave')
    }
    const unpitched = find(c, 'unpitched')
    if (unpitched) {
        const uc = kids(unpitched)
        ev.step = childText(uc, 'display-step')?.toUpperCase() ?? 'B'
        ev.octave = childNum(uc, 'display-octave') ?? 4
    }
    const acc = childText(c, 'accidental')
    if (acc) ev.accidental = acc
    const stem = childText(c, 'stem')
    if (stem === 'up' || stem === 'down') ev.stem = stem
    for (const b of findAll(c, 'beam')) {
        if ((attr(b, 'number') ?? '1') !== '1') continue
        ev.beam = textOf(b).trim()
        ctx.hasBeams = true
    }
    for (const t of findAll(c, 'tie')) {
        if (attr(t, 'type') === 'start') ev.tieStart = true
        if (attr(t, 'type') === 'stop') ev.tieStop = true
    }

    const marks: N[] = []
    for (const notations of findAll(c, 'notations')) {
        for (const n of kids(notations)) {
            const tag = tagOf(n)
            if (tag === 'tied') {
                if (attr(n, 'type') === 'start') ev.tieStart = true
                if (attr(n, 'type') === 'stop') ev.tieStop = true
            } else if (tag === 'slur') {
                const st = attr(n, 'type')
                if (st === 'start' || st === 'stop') ev.slurs.push({type: st, number: attr(n, 'number') ?? '1'})
            } else if (tag === 'articulations') {
                for (const a of kids(n)) {
                    const m = ARTICULATION_MARK[tagOf(a) ?? '']
                    if (m) marks.push(m)
                }
            } else if (tag === 'ornaments') {
                for (const o of kids(n)) {
                    const ot = tagOf(o) ?? ''
                    if (ot === 'wavy-line') {
                        const wt = attr(o, 'type')
                        if (wt === 'start' || wt === 'stop') ev.wavy.push({type: wt, number: attr(o, 'number') ?? '1'})
                        continue
                    }
                    const m = ORNAMENT_MARK[ot]
                    if (m) marks.push(m)
                }
            } else if (tag === 'technical') {
                for (const t of kids(n)) {
                    const m = TECHNICAL_MARK[tagOf(t) ?? '']
                    if (m) marks.push(m)
                }
            } else if (tag === 'dynamics') {
                for (const d of kids(n)) {
                    const m = DYNAMIC_MARK[tagOf(d) ?? '']
                    if (m) marks.push(m)
                }
            } else if (tag === 'arpeggiate') {
                ev.arpeggio = true
            }
        }
    }
    // 有颤音线时 tr 由颤音线画出，不再单独挂
    if (ev.wavy.some((w) => w.type === 'start')) {
        const i = marks.indexOf(N.Trill)
        if (i >= 0) marks.splice(i, 1)
    }
    ev.marks = combineMarks(marks)

    for (const lyric of findAll(c, 'lyric')) {
        const lc = kids(lyric)
        const key = attr(lyric, 'number') ?? attr(lyric, 'name') ?? '1'
        if (!ctx.lyricKeys.includes(key)) ctx.lyricKeys.push(key)
        let text = findAll(lc, 'text').map((t) => textOf(t)).join(find(lc, 'elision') ? '‿' : '')
        const syllabic = childText(lc, 'syllabic')
        if (text && (syllabic === 'begin' || syllabic === 'middle')) text += '-'
        if (text) ev.lyrics.push({key, text})
    }
    return ev
}

function readAttributes(node: XNode, onset: number, events: MeasureEv[], ctx: PartCtx) {
    for (const a of kids(node)) {
        const tag = tagOf(a)
        const ac = kids(a)
        if (tag === 'divisions') {
            const d = Number(textOf(a))
            if (Number.isFinite(d) && d > 0) ctx.divisions = d
        } else if (tag === 'staves') {
            const s = Number(textOf(a))
            if (Number.isFinite(s) && s > 0) ctx.staves = Math.max(ctx.staves, Math.min(16, Math.round(s)))
        } else if (tag === 'key') {
            const fifths = childNum(ac, 'fifths')
            const staffAttr = attr(a, 'number')
            events.push({
                kind: 'key',
                seq: ctx.seq++,
                onset,
                fifths: Math.max(-7, Math.min(7, Math.round(fifths ?? 0))),
                ...(staffAttr ? {staff: Number(staffAttr)} : {}),
            })
        } else if (tag === 'time') {
            const symbol = attr(a, 'symbol')
            const beatsText = childText(ac, 'beats')
            const beatTypeText = childText(ac, 'beat-type')
            // 复合拍号 3+2 → 5
            const beats = (beatsText ?? '').split('+').reduce((n, s) => n + (Number(s) || 0), 0)
            const beatType = Number(beatTypeText)
            if (!(beats > 0) || !(beatType > 0)) continue
            let type = symbol ? timeSignatureSymbolToType(symbol) : undefined
            if (type && !((type === TimeSignatureTypeEnum.Common && beats === 4 && beatType === 4)
                || (type === TimeSignatureTypeEnum.Cut && beats === 2 && beatType === 2))) type = undefined
            type ??= beatsToTimeSignatureType(beats, beatType)
            const staffAttr = attr(a, 'number')
            events.push({
                kind: 'time',
                seq: ctx.seq++,
                onset,
                beats,
                beatType,
                ...(type ? {type} : {}),
                ...(staffAttr ? {staff: Number(staffAttr)} : {}),
            })
        } else if (tag === 'clef') {
            if (attr(a, 'print-object') === 'no' && events.some((e) => e.kind === 'clef')) continue
            const sign = childText(ac, 'sign')
            if ((sign ?? '').toUpperCase() === 'NONE') continue
            events.push({
                kind: 'clef',
                seq: ctx.seq++,
                staff: Number(attr(a, 'number') ?? 1),
                onset,
                clef: xmlClef(sign, childNum(ac, 'line')),
                octaveChange: Math.round(childNum(ac, 'clef-octave-change') ?? 0),
            })
        }
    }
}

function readDirection(node: XNode, onsetDiv: number, events: MeasureEv[], ctx: PartCtx, ir: ScoreIR) {
    const c = kids(node)
    const offset = childNum(c, 'offset') ?? 0
    const onset = Math.max(0, toUnits(onsetDiv + offset, ctx))
    const staff = Math.max(1, Math.round(childNum(c, 'staff') ?? 1))
    const push = (dir: Direction) => events.push({kind: 'dir', seq: ctx.seq++, staff, onset, dir})

    const sound = find(c, 'sound')
    if (sound) readSound(sound, push, ir)

    let words = ''
    for (const dt of findAll(c, 'direction-type')) {
        for (const d of kids(dt)) {
            const tag = tagOf(d)
            if (tag === 'dynamics') {
                for (const dyn of kids(d)) {
                    const m = DYNAMIC_MARK[tagOf(dyn) ?? '']
                    if (m) push({t: 'dynamic', name: m})
                }
            } else if (tag === 'wedge') {
                const type = attr(d, 'type')
                const number = attr(d, 'number') ?? '1'
                if (type === 'crescendo' || type === 'diminuendo') {
                    push({t: 'wedge', type: 'start', crescendo: type === 'crescendo', number})
                } else if (type === 'stop') {
                    push({t: 'wedge', type: 'stop', number})
                }
            } else if (tag === 'dashes') {
                const type = attr(d, 'type')
                const number = 'dash' + (attr(d, 'number') ?? '1')
                if (type === 'start' && /^\s*(cresc|dim|decresc)/i.test(words)) {
                    push({t: 'wedge', type: 'start', line: true, crescendo: /^\s*cresc/i.test(words), number})
                } else if (type === 'stop') {
                    push({t: 'wedge', type: 'stop', number})
                }
            } else if (tag === 'pedal') {
                const type = attr(d, 'type')
                if (type === 'start' || type === 'resume') push({t: 'pedal', type: 'start'})
                else if (type === 'stop' || type === 'discontinue') push({t: 'pedal', type: 'stop'})
                else if (type === 'change') push({t: 'pedal', type: 'change'})
            } else if (tag === 'octave-shift') {
                const type = attr(d, 'type')
                const number = attr(d, 'number') ?? '1'
                const size = Number(attr(d, 'size') ?? 8)
                if (type === 'up' || type === 'down') {
                    // type=down：谱面比实际音高低（8va）
                    push({t: 'octave', type: 'start', up: type === 'down', size, number})
                } else if (type === 'stop') {
                    push({t: 'octave', type: 'stop', number})
                }
            } else if (tag === 'segno') {
                push({t: 'startRepeat', value: MeasureStartRepeatEnum.Segno})
            } else if (tag === 'coda') {
                push({t: 'startRepeat', value: MeasureStartRepeatEnum.Coda})
            } else if (tag === 'words') {
                words += textOf(d)
            } else if (tag === 'metronome' && ir.bpm == null) {
                const unit = childText(kids(d), 'beat-unit')
                const perMinute = childNum(kids(d), 'per-minute')
                if (perMinute && perMinute > 0) {
                    const scale = (TYPE_TO_CHRONAXIE[unit ?? 'quarter'] ?? 64) / 64
                    const dotted = find(kids(d), 'beat-unit-dot') ? 1.5 : 1
                    ir.bpm = Math.round(perMinute * scale * dotted)
                }
            }
        }
    }
    if (words) {
        for (const [re, value] of END_REPEAT_WORDS) {
            if (re.test(words)) {
                push({t: 'endRepeat', value})
                break
            }
        }
    }
}

function readSound(sound: XNode, push: ((dir: Direction) => void) | undefined, ir: ScoreIR) {
    const tempo = Number(attr(sound, 'tempo'))
    if (ir.bpm == null && Number.isFinite(tempo) && tempo > 0) ir.bpm = Math.round(tempo)
    if (!push) return
    if (attr(sound, 'segno')) push({t: 'startRepeat', value: MeasureStartRepeatEnum.Segno})
    if (attr(sound, 'coda')) push({t: 'startRepeat', value: MeasureStartRepeatEnum.Coda})
    if (attr(sound, 'tocoda')) push({t: 'endRepeat', value: MeasureEndRepeatEnum.To_coda})
    if (attr(sound, 'fine')) push({t: 'endRepeat', value: MeasureEndRepeatEnum.Fine})
}

function readBarline(node: XNode, m: MeasureIR) {
    const c = kids(node)
    const location = attr(node, 'location') ?? 'right'
    const bar: BarlineIR = {}
    const style = childText(c, 'bar-style')
    if (style) bar.style = style
    const repeat = find(c, 'repeat')
    const dir = repeat ? attr(repeat, 'direction') : undefined
    if (dir === 'forward' || dir === 'backward') bar.repeat = dir
    if (location === 'left') m.barLeft = {...m.barLeft, ...bar}
    else if (location === 'right') m.barRight = {...m.barRight, ...bar}
    for (const ending of findAll(c, 'ending')) {
        const number = attr(ending, 'number')
        const type = attr(ending, 'type')
        if (!number || !type) continue
        const text = textOf(ending).trim()
        m.endings.push({number, type, ...(text ? {text} : {})})
    }
}

function readMeasure(node: XNode, ctx: PartCtx, ir: ScoreIR): MeasureIR {
    const m: MeasureIR = {
        number: attr(node, 'number') ?? '',
        implicit: attr(node, 'implicit') === 'yes',
        newSystem: false,
        events: [],
        length: 0,
        endings: [],
    }
    let time = 0
    let maxTime = 0
    let lastOnset = 0
    /** 当前和弦组已出现过的谱表；跨谱表和弦在新谱表上的第一个音当作该谱表的和弦头 */
    let chordStaves = new Set<number>()
    for (const child of kids(node)) {
        const tag = tagOf(child)
        try {
            switch (tag) {
                case 'attributes':
                    readAttributes(child, toUnits(time, ctx), m.events, ctx)
                    break
                case 'note': {
                    const isChord = !!find(kids(child), 'chord')
                    const ev = readNote(child, isChord ? lastOnset : time, ctx)
                    ctx.staves = Math.max(ctx.staves, Math.min(16, ev.staff))
                    if (!ev.grace) {
                        if (!isChord) chordStaves = new Set()
                        else if (!chordStaves.has(ev.staff)) ev.chord = false
                        chordStaves.add(ev.staff)
                    }
                    m.events.push(ev)
                    if (!isChord && !ev.grace) {
                        lastOnset = time
                        time += childNum(kids(child), 'duration') ?? 0
                    }
                    break
                }
                case 'backup':
                    time = Math.max(0, time - (childNum(kids(child), 'duration') ?? 0))
                    break
                case 'forward':
                    time += childNum(kids(child), 'duration') ?? 0
                    break
                case 'direction':
                    readDirection(child, time, m.events, ctx, ir)
                    break
                case 'sound':
                    readSound(child, undefined, ir)
                    break
                case 'barline':
                    readBarline(child, m)
                    break
                case 'print':
                    if (attr(child, 'new-system') === 'yes' || attr(child, 'new-page') === 'yes') m.newSystem = true
                    break
            }
        } catch (e) {
            ir.warnings.push(`小节 ${m.number} 的 <${tag}> 解析失败：${(e as Error)?.message ?? e}`)
        }
        maxTime = Math.max(maxTime, time)
    }
    m.length = toUnits(maxTime, ctx)
    return m
}

/** preserveOrder JSON → ScoreIR；不是乐谱时返回 undefined */
export function readScoreIR(xmlData: unknown): ScoreIR | undefined {
    const root = findRoot(xmlData)
    if (!root) return undefined
    const children = root.tag === 'score-timewise' ? timewiseToPartwise(root.children) : root.children
    const ir: ScoreIR = {title: '', subTitle: '', author: '', parts: [], warnings: []}
    try {
        readMeta(children, ir)
    } catch {
        // 元信息缺失不影响曲谱
    }
    const names = readPartNames(children)
    for (const part of findAll(children, 'part')) {
        const id = attr(part, 'id') ?? `P${ir.parts.length + 1}`
        const ctx: PartCtx = {divisions: 1, seq: 0, staves: 1, hasBeams: false, lyricKeys: []}
        const measures: MeasureIR[] = []
        for (const mNode of findAll(kids(part), 'measure')) measures.push(readMeasure(mNode, ctx, ir))
        if (!measures.length) continue
        // 歌词 number 可能是 "1"/"2" 也可能是 "verse1"，统一换成按出现顺序的下标
        for (const m of measures) {
            for (const ev of m.events) {
                if (ev.kind !== 'note') continue
                for (const l of ev.lyrics) l.key = String(ctx.lyricKeys.indexOf(l.key))
            }
        }
        ir.parts.push({id, name: names.get(id) ?? '', staves: ctx.staves, measures, hasBeams: ctx.hasBeams})
    }
    return ir
}
