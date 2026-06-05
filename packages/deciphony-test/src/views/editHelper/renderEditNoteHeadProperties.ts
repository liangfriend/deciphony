import type {Chronaxie, Measure, NoteSymbol, NotesInfo, SlotData} from 'deciphony-renderer'
import {AccidentalTypeEnum, BeamTypeEnum} from 'deciphony-renderer'
import {createAccidental, createAugmentationDot} from '../dr-extensions/dr-edit/score-builder'

export type NoteHeadEditSlot = SlotData & {info: NotesInfo; note: NoteSymbol; measure: Measure}

export const BEAM_TYPE_OPTIONS: {value: BeamTypeEnum; label: string}[] = [
  {value: BeamTypeEnum.Combined, label: '全连'},
  {value: BeamTypeEnum.OnlyRight, label: '右连'},
  {value: BeamTypeEnum.None, label: '无'},
]

export const ACCIDENTAL_OPTIONS: {value: AccidentalTypeEnum; label: string}[] = [
  {value: AccidentalTypeEnum.Sharp, label: '升号 ♯'},
  {value: AccidentalTypeEnum.Flat, label: '降号 ♭'},
  {value: AccidentalTypeEnum.Double_sharp, label: '重升 𝄪'},
  {value: AccidentalTypeEnum.Double_flat, label: '重降 𝄫'},
  {value: AccidentalTypeEnum.Natural, label: '还原 ♮'},
]

/** 变音符号选择器选项（含「无」= 删除 accidental） */
export const ACCIDENTAL_SELECT_OPTIONS: {value: AccidentalTypeEnum | ''; label: string}[] = [
  {value: '', label: '无'},
  ...ACCIDENTAL_OPTIONS,
]

export const AUGMENTATION_DOT_OPTIONS: {value: 0 | 1 | 2 | 3; label: string}[] = [
  {value: 0, label: '无'},
  {value: 1, label: '单附点'},
  {value: 2, label: '双附点'},
  {value: 3, label: '三附点'},
]

export function setNotesInfoChronaxie(info: NotesInfo, chronaxie: Chronaxie): void {
  info.chronaxie = chronaxie
}

export function setNotesInfoBeamType(info: NotesInfo, beamType: BeamTypeEnum): void {
  info.beamType = beamType
}

export function setNotesInfoAccidental(info: NotesInfo, type: AccidentalTypeEnum | ''): void {
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

export function setNotesInfoAugmentationDot(info: NotesInfo, count: 0 | 1 | 2 | 3): void {
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
