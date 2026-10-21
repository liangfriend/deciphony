import type {
  Chronaxie,
  DrumNote,
  DrumRest,
  MeasureNoteSymbol,
  SlotData,
  TabNote,
  TabNoteInfo,
} from '@deciphony/renderer'
import {MusicScoreTypeEnum} from '@deciphony/renderer'
import {
  isDrumNotesInfo,
  isDrumRestBody,
  setDrumNoteChronaxie,
  setDrumRestChronaxie,
} from '@deciphony/extensions/dr-edit'
import {CHRONAXIE_OPTIONS} from './renderEditAddNoteState'
import {DRUM_CHRONAXIE_OPTIONS} from './drumNotation/renderEditDrumAddState'
import {isNumberHeadSelected} from './numberNotation/renderEditNumberHeadDrag'
import {isRestSelected} from './renderEditDelete'
import {isNoteHeadSelected} from './standardStaff/renderEditNoteHeadDrag'
import {isMeasureAddMode} from './standardStaff/renderEditSymbolAddAction'
import {isTabInfoSelected} from './tab/renderEditTabSelection'

type ChronaxieHolder = {chronaxie: Chronaxie}

function chronaxieOptionsFor(selected: SlotData | null): {value: Chronaxie; label: string}[] {
  return selected?.musicScore.type === MusicScoreTypeEnum.DrumNotation
    ? DRUM_CHRONAXIE_OPTIONS
    : CHRONAXIE_OPTIONS
}

function nextChronaxie(current: Chronaxie, options: {value: Chronaxie}[]): Chronaxie {
  const idx = options.findIndex((opt) => opt.value === current)
  return options[(idx + 1) % options.length]?.value ?? options[0]!.value
}

/**
 * o：循环时值。
 * - 小节添加模式 → 改添加面板 chronaxie
 * - 选中音符头 / 休止符 → 改当前时值
 */
export function cycleSelectedChronaxie(
  selected: SlotData | null,
  addState?: ChronaxieHolder | null,
): boolean {
  const options = chronaxieOptionsFor(selected)

  if (isMeasureAddMode(selected) && addState) {
    addState.chronaxie = nextChronaxie(addState.chronaxie, options)
    return true
  }

  if (selected?.musicScore.type === MusicScoreTypeEnum.DrumNotation) {
    if (
      selected.measure
      && isDrumNotesInfo(selected.info)
      && selected.self === selected.info
      && selected.note
    ) {
      setDrumNoteChronaxie(
        selected.note as unknown as DrumNote,
        nextChronaxie(selected.info.chronaxie, options),
      )
      return true
    }
    const self = selected.self as unknown as MeasureNoteSymbol
    if (selected.measure && isDrumRestBody(self)) {
      setDrumRestChronaxie(self as DrumRest, nextChronaxie((self as DrumRest).chronaxie, options))
      return true
    }
  }

  if (isNoteHeadSelected(selected) || isNumberHeadSelected(selected)) {
    selected.info.chronaxie = nextChronaxie(selected.info.chronaxie, options)
    return true
  }

  if (isTabInfoSelected(selected) && selected.info && selected.note) {
    const next = nextChronaxie((selected.info as TabNoteInfo).chronaxie, options)
    const note = selected.note as unknown as TabNote
    for (const info of note.notesInfo) info.chronaxie = next
    return true
  }

  if (isRestSelected(selected)) {
    selected.self.chronaxie = nextChronaxie(selected.self.chronaxie, options)
    return true
  }

  return false
}

type GraceHost = {
  graceNotes?: unknown[]
  graceNotesAfter?: unknown[]
}

function isGraceInfoOf(note: GraceHost, infoId: string | undefined): boolean {
  if (!infoId) return false
  const before = note.graceNotes as {id?: string}[] | undefined
  const after = note.graceNotesAfter as {id?: string}[] | undefined
  return (
    (before?.some((g) => g.id === infoId) ?? false)
    || (after?.some((g) => g.id === infoId) ?? false)
  )
}

/**
 * l：清空当前音符的前/后倚音。
 * 若当前选中的就是倚音头，清空后调用方应 clearSelection。
 * @returns `'cleared-grace-selection'` 表示选中项已随倚音一起被清掉；`'cleared'` 仅清空；`false` 未处理
 */
export function clearSelectedGraceNotes(
  selected: SlotData | null,
): false | 'cleared' | 'cleared-grace-selection' {
  const note = selected?.note as GraceHost | null | undefined
  if (!note) return false
  const had =
    (note.graceNotes?.length ?? 0) > 0 || (note.graceNotesAfter?.length ?? 0) > 0
  if (!had) return false
  const selectingGrace = isGraceInfoOf(note, selected.info && 'id' in selected.info
    ? (selected.info as {id: string}).id
    : undefined)
  delete note.graceNotes
  delete note.graceNotesAfter
  return selectingGrace ? 'cleared-grace-selection' : 'cleared'
}
