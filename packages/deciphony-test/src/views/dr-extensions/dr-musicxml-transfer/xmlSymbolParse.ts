import {
    AccidentalTypeEnum,
    ClefTypeEnum,
    type Chronaxie,
    KeySignatureTypeEnum,
    TimeSignatureTypeEnum,
    beatsToTimeSignatureType,
    timeSignatureSymbolToType,
} from 'deciphony-renderer';

const STEP_SEMITONE: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

const XML_TYPE_TO_CHRONAXIE: Record<string, Chronaxie> = {
    whole: 256,
    half: 128,
    quarter: 64,
    eighth: 32,
    '16th': 16,
    '32nd': 8,
    '64th': 4,
}

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

/** 解析 xml attributes 中的 clef → ClefTypeEnum */
export function xmlClefToType(attrItem: any): ClefTypeEnum {
    const clefBlock = attrItem.clef
    if (!Array.isArray(clefBlock)) return ClefTypeEnum.Treble
    let sign = 'G'
    let line = 2
    for (const item of clefBlock) {
        if (item.sign) sign = String(item.sign[0]?.['#text'] ?? 'G').toUpperCase()
        if (item.line) line = Number(item.line[0]?.['#text'] ?? 2)
    }
    if (sign === 'F') return ClefTypeEnum.Bass
    if (sign === 'C') return line >= 4 ? ClefTypeEnum.Tenor : ClefTypeEnum.Alto
    return ClefTypeEnum.Treble
}

/** 解析 xml attributes 中的 key → KeySignatureTypeEnum */
export function xmlKeyToType(attrItem: any): KeySignatureTypeEnum {
    const keyBlock = attrItem.key
    if (!Array.isArray(keyBlock)) return KeySignatureTypeEnum.C
    let fifths = 0
    for (const item of keyBlock) {
        if (item.fifths) fifths = Number(item.fifths[0]?.['#text'] ?? 0)
    }
    return FIFTHS_TO_KEY[fifths] ?? KeySignatureTypeEnum.C
}

/** 解析 xml attributes 中的 time → TimeSignatureTypeEnum */
export function xmlTimeToType(attrItem: any): TimeSignatureTypeEnum | undefined {
    const timeBlock = attrItem.time
    if (!Array.isArray(timeBlock)) return undefined
    let beats: string | undefined
    let beatType: string | undefined
    let symbol: string | undefined
    for (const item of timeBlock) {
        if (item.beats) beats = String(item.beats[0]?.['#text'])
        if (item['beat-type']) beatType = String(item['beat-type'][0]?.['#text'])
        if (item.symbol) symbol = String(item.symbol[0]?.['#text'])
    }
    if (symbol) {
        const bySymbol = timeSignatureSymbolToType(symbol)
        if (bySymbol) return bySymbol
    }
    if (!beats || !beatType) return undefined
    return beatsToTimeSignatureType(beats, beatType)
}

/** 解析 xml pitch 块 → midi */
export function pitchToMidi(pitchBlock: any[]): number | null {
    if (!Array.isArray(pitchBlock)) return null
    let step: string | undefined
    let alter = 0
    let octave = 4
    for (const item of pitchBlock) {
        if (item.step) step = String(item.step[0]?.['#text'] ?? '').toUpperCase()
        if (item.alter) alter = Number(item.alter[0]?.['#text'] ?? 0)
        if (item.octave) octave = Number(item.octave[0]?.['#text'] ?? 4)
    }
    if (!step || STEP_SEMITONE[step] == null) return null
    return (octave + 1) * 12 + STEP_SEMITONE[step]! + alter
}

const CHRONAXIES: Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1]

/** 解析 xml note type → chronaxie */
export function xmlTypeToChronaxie(typeBlock: any[]): Chronaxie {
    const type = String(typeBlock?.[0]?.['#text'] ?? 'quarter')
    return XML_TYPE_TO_CHRONAXIE[type] ?? 64
}

/** 判断 xml note 块是否为休止符 */
export function isXmlRestNote(noteBlock: any[]): boolean {
    return Array.isArray(noteBlock) && noteBlock.some((item) => 'rest' in item)
}

/** duration + divisions → chronaxie */
export function xmlDurationToChronaxie(duration: number, divisions: number): Chronaxie {
    const raw = (duration / divisions) * 64
    return CHRONAXIES.find((c) => c === raw) ?? 64
}

export type ParsedXmlNote = {
    staffNum: number
    duration: number
    chronaxie: Chronaxie
    isRest: boolean
    isChord: boolean
    pitchBlock?: any[]
    stem?: 'up' | 'down'
    dotCount: number
    hasBeam: boolean
    accidentalText?: string
}

/** 解析 xml note 块（音符 / 休止符通用） */
export function parseXmlNoteBlock(noteBlock: any[], divisions: number): ParsedXmlNote {
    let staffNum = 1
    let duration = 0
    let chronaxie: Chronaxie = 64
    let hasType = false
    let pitchBlock: any[] | undefined
    let stem: 'up' | 'down' | undefined
    let dotCount = 0
    let hasBeam = false
    let accidentalText: string | undefined
    const isChord = noteBlock.some((item) => 'chord' in item)

    for (const noteChild of noteBlock) {
        if (noteChild.staff) staffNum = Number(noteChild.staff[0]?.['#text'] ?? 1)
        if (noteChild.pitch) pitchBlock = noteChild.pitch
        if (noteChild.duration) duration = Number(noteChild.duration[0]?.['#text'] ?? 0)
        if (noteChild.type) {
            chronaxie = xmlTypeToChronaxie(noteChild.type)
            hasType = true
        }
        if (noteChild.stem) {
            const dir = String(noteChild.stem[0]?.['#text'] ?? '')
            if (dir === 'up' || dir === 'down') stem = dir
        }
        if (noteChild.dot != null) dotCount++
        if (noteChild.beam != null) hasBeam = true
        if (noteChild.accidental) {
            accidentalText = String(noteChild.accidental[0]?.['#text'] ?? '')
        }
    }

    if (!hasType && duration > 0) {
        chronaxie = xmlDurationToChronaxie(duration, divisions)
    }

    const parsed: ParsedXmlNote = {
        staffNum,
        duration,
        chronaxie,
        isRest: isXmlRestNote(noteBlock),
        isChord,
        dotCount,
        hasBeam,
    }
    if (pitchBlock) parsed.pitchBlock = pitchBlock
    if (stem) parsed.stem = stem
    if (accidentalText) parsed.accidentalText = accidentalText
    return parsed
}

/** xml accidental 文本 → getNoteRegionAndAccidental 的 priority 参数 */
export function xmlAccidentalToPriority(accidental: string): AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat {
    if (accidental === 'flat' || accidental === 'flat-flat') return AccidentalTypeEnum.Flat
    return AccidentalTypeEnum.Sharp
}
