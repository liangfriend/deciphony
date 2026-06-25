import type {Chronaxie, Measure, NoteNumber, NotesNumberInfo, SlotData} from 'deciphony-renderer'
import {AccidentalTypeEnum, BeamTypeEnum} from 'deciphony-renderer'
import {createAccidental, createAugmentationDot} from '../../dr-extensions/dr-edit/score-builder'

export type NumberHeadEditSlot = SlotData & {info: NotesNumberInfo; note: NoteNumber; measure: Measure}

export const SYLLABLE_OPTIONS: {value: NotesNumberInfo['syllable']; label: string}[] = [
  {value: 1, label: '1 (do)'},
  {value: 2, label: '2 (re)'},
  {value: 3, label: '3 (mi)'},
  {value: 4, label: '4 (fa)'},
  {value: 5, label: '5 (sol)'},
  {value: 6, label: '6 (la)'},
  {value: 7, label: '7 (si)'},
  {value: 'X', label: '节奏 X'},
]

export const OCTAVE_DOT_OPTIONS: {value: NotesNumberInfo['octaveDot']; label: string}[] = [
  {value: -2, label: '低两个八度'},
  {value: -1, label: '低一个八度'},
  {value: 0, label: '无'},
  {value: 1, label: '高一个八度'},
  {value: 2, label: '高两个八度'},
]

export const BEAM_TYPE_OPTIONS: {value: BeamTypeEnum; label: string}[] = [
  {value: BeamTypeEnum.Combined, label: '全连'},
  {value: BeamTypeEnum.OnlyRight, label: '右连'},
  {value: BeamTypeEnum.None, label: '无'},
]

export const ACCIDENTAL_SELECT_OPTIONS: {value: AccidentalTypeEnum | ''; label: string}[] = [
  {value: '', label: '无'},
  {value: AccidentalTypeEnum.Sharp, label: '升号 ♯'},
  {value: AccidentalTypeEnum.Flat, label: '降号 ♭'},
  {value: AccidentalTypeEnum.Double_sharp, label: '重升 𝄪'},
  {value: AccidentalTypeEnum.Double_flat, label: '重降 𝄫'},
  {value: AccidentalTypeEnum.Natural, label: '还原 ♮'},
]

export const AUGMENTATION_DOT_OPTIONS: {value: 0 | 1 | 2 | 3; label: string}[] = [
  {value: 0, label: '无'},
  {value: 1, label: '单附点'},
  {value: 2, label: '双附点'},
  {value: 3, label: '三附点'},
]

export function setNotesNumberInfoChronaxie(info: NotesNumberInfo, chronaxie: Chronaxie): void {
  info.chronaxie = chronaxie
}

export function setNotesNumberInfoBeamType(info: NotesNumberInfo, beamType: BeamTypeEnum): void {
  info.beamType = beamType
}

export function setNotesNumberInfoSyllable(info: NotesNumberInfo, syllable: NotesNumberInfo['syllable']): void {
  info.syllable = syllable
}

export function setNotesNumberInfoOctaveDot(
  info: NotesNumberInfo,
  octaveDot: NotesNumberInfo['octaveDot'],
): void {
  info.octaveDot = octaveDot
}

export function setNotesNumberInfoAccidental(info: NotesNumberInfo, type: AccidentalTypeEnum | ''): void {
  if (type === '') {
    delete info.accidental
    return
  }
  if (info.accidental) {
    info.accidental.type = type
  } else {
    info.accidental = createAccidental(type)
  }
}

export function setNotesNumberInfoAugmentationDot(info: NotesNumberInfo, count: 0 | 1 | 2 | 3): void {
  if (count === 0) {
    delete info.augmentationDot
    return
  }
  if (info.augmentationDot) {
    info.augmentationDot.count = count
  } else {
    info.augmentationDot = createAugmentationDot(count)
  }
}
