/**
 * 吉他 / 尤克里里 / 贝斯空弦音高，以及「品 / 当前和弦 / 空弦」换算。
 * region 0 = 1 弦（与 dr-edit tabNote 一致）。
 * 吉他 / 尤克里里：1 弦为最高弦；贝斯：1 弦为最低弦（谱面弦序相反）。
 * 拍弦、推弦、泛音不另作音高处理。
 *
 * 曲谱 type 已按乐器区分（Guitar / Ukulele / Bass4 / Bass5 / Bass6），
 * 空弦表优先看 type；options.openMidi 仍可整谱覆盖。
 */
import {MusicScoreTypeEnum} from '@deciphony/renderer'

/** 标准吉他：1 弦 E4 … 6 弦 E2 */
export const GUITAR_OPEN_MIDI = [64, 59, 55, 50, 45, 40] as const

/** 标准尤克里里（高音 G 再入式）：1 弦 A4、2 弦 E4、3 弦 C4、4 弦 G4 */
export const UKULELE_OPEN_MIDI = [69, 64, 60, 67] as const

/** 四弦贝斯（标准）：1 弦 E1 … 4 弦 G2 */
export const BASS4_OPEN_MIDI = [28, 33, 38, 43] as const

/** 五弦贝斯（加低 B）：1 弦 B0 … 5 弦 G2 */
export const BASS5_OPEN_MIDI = [23, 28, 33, 38, 43] as const

/** 六弦贝斯（低 B + 高 C）：1 弦 B0 … 6 弦 C3 */
export const BASS6_OPEN_MIDI = [23, 28, 33, 38, 43, 48] as const

/** 指板乐器（与 MusicScoreTypeEnum 对齐） */
export type FretInstrument = 'guitar' | 'ukulele' | 'bass4' | 'bass5' | 'bass6'

export type ChordFinger = 'x' | 'o' | number

export type ChordStringState = {finger: ChordFinger}

export type ChordBarre = {
  fret: number
  startStringNumber: number
  endStringNumber: number
}

/** 播放只用到的和弦图字段；与 tabChord 结构兼容 */
export type ChordShape = {
  name?: string
  baseFret?: number
  stringStates?: ChordStringState[]
  barres?: ChordBarre[]
}

/** 空占位和弦图（无名字、无按弦、无横按）不覆盖当前生效和弦 */
export function isChordSymbol(chord: ChordShape | null | undefined): chord is ChordShape {
  if (!chord) return false
  if (chord.name?.trim()) return true
  if (chord.stringStates?.some((state) => state.finger !== -1)) return true
  return chord.barres?.some((barre) => barre.startStringNumber <= barre.endStringNumber) ?? false
}

/**
 * 和弦图上某一弦的绝对品。
 * finger / barre.fret 为相对品：0 = 第 baseFret+1 品。
 * 'o' 空弦，'x' 闷音，-1 或未写表示这根弦没有指定。
 */
export function chordFretForString(chord: ChordShape, region: number): number | 'mute' | null {
  const baseFret = chord.baseFret ?? 0
  const state = chord.stringStates?.[region]
  if (state) {
    if (state.finger === 'x') return 'mute'
    if (state.finger === 'o') return 0
    if (typeof state.finger === 'number' && state.finger >= 0) {
      return baseFret + state.finger + 1
    }
  }
  const barre = chord.barres?.find(
    (item) =>
      item.startStringNumber <= item.endStringNumber
      && region >= item.startStringNumber
      && region <= item.endStringNumber
      && item.fret >= 0,
  )
  if (!barre) return null
  return baseFret + barre.fret + 1
}

/**
 * 有品（value >= 0，含 0）用音符自己的品；
 * value 为 x（< 0）或缺失时用当前和弦该弦；
 * 和弦也没写这根弦则空弦。和弦闷音不发声。
 */
export function resolveStringMidi(
  openMidi: readonly number[],
  region: number,
  value: number | null | undefined,
  chord: ChordShape | null,
): number | null {
  const open = openMidi[region]
  if (open == null) return null
  if (typeof value === 'number' && value >= 0) return open + value
  if (!chord) return open
  const fret = chordFretForString(chord, region)
  if (fret === 'mute') return null
  if (fret == null) return open
  return open + fret
}

/** @deprecated 使用 resolveStringMidi */
export const resolveTabStringMidi = resolveStringMidi

export function fretInstrumentFromScoreType(scoreType: MusicScoreTypeEnum | undefined): FretInstrument {
  switch (scoreType) {
    case MusicScoreTypeEnum.Ukulele:
      return 'ukulele'
    case MusicScoreTypeEnum.Bass4:
      return 'bass4'
    case MusicScoreTypeEnum.Bass5:
      return 'bass5'
    case MusicScoreTypeEnum.Bass6:
      return 'bass6'
    case MusicScoreTypeEnum.Guitar:
    default:
      return 'guitar'
  }
}

export function openMidiForFretInstrument(instrument: FretInstrument): readonly number[] {
  switch (instrument) {
    case 'ukulele':
      return UKULELE_OPEN_MIDI
    case 'bass4':
      return BASS4_OPEN_MIDI
    case 'bass5':
      return BASS5_OPEN_MIDI
    case 'bass6':
      return BASS6_OPEN_MIDI
    case 'guitar':
    default:
      return GUITAR_OPEN_MIDI
  }
}

/** 按曲谱 type 取空弦表（可被 options.openMidi 覆盖） */
export function resolveOpenMidiForScoreType(scoreType: MusicScoreTypeEnum | undefined): readonly number[] {
  return openMidiForFretInstrument(fretInstrumentFromScoreType(scoreType))
}

/** @deprecated 使用 resolveOpenMidiForScoreType；hint 已不再参与（type 已含乐器） */
export function resolveTabOpenMidi(scoreType: MusicScoreTypeEnum | undefined, _hint?: string | null): readonly number[] {
  return resolveOpenMidiForScoreType(scoreType)
}

/** @deprecated */
export type TabInstrumentKind = 'guitar' | 'ukulele' | 'bass'

/** @deprecated 使用 fretInstrumentFromScoreType */
export function resolveTabInstrumentKind(scoreType: MusicScoreTypeEnum | undefined, _hint?: string | null): TabInstrumentKind {
  const i = fretInstrumentFromScoreType(scoreType)
  if (i === 'ukulele') return 'ukulele'
  if (i.startsWith('bass')) return 'bass'
  return 'guitar'
}

/** @deprecated 使用 openMidiForFretInstrument */
export function openMidiForTabInstrument(
  scoreType: MusicScoreTypeEnum | undefined,
  kind: TabInstrumentKind,
  _hint?: string | null,
): readonly number[] {
  if (kind === 'bass') return resolveOpenMidiForScoreType(
    scoreType === MusicScoreTypeEnum.Bass4 || scoreType === MusicScoreTypeEnum.Bass5 || scoreType === MusicScoreTypeEnum.Bass6
      ? scoreType
      : MusicScoreTypeEnum.Bass6,
  )
  if (kind === 'ukulele') return UKULELE_OPEN_MIDI
  return GUITAR_OPEN_MIDI
}

/** @deprecated */
export function isBassInstrumentHint(hint: string | null | undefined): boolean {
  if (hint == null) return false
  const s = hint.trim().toLowerCase()
  return Boolean(s && (s.includes('bass') || s.includes('贝斯')))
}
