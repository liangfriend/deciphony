import {BeamTypeEnum, NoteSymbolTypeEnum} from '@deciphony/renderer'
import type {Measure, NoteNumber, NoteRest, NoteSymbol, StaffSlot} from '@deciphony/renderer'
import {isNoteNumberSlot, isSlotRestLike} from './noteSlot'

/** 四分音符 chronaxie；按「四分之一拍」分组连杠 */
export const AUTO_BEAM_BEAT_CHRONAXIE = 64

/**
 * 按时值与在小节内的 onset 推断 beamType：
 * - chronaxie ≥ 一拍（默认 64，四分及以上）→ None
 * - onset 落在拍点（拍的第一个可连音）→ OnlyRight（右连）
 * - 拍内后续可连音 → Combined（全连）
 */
export function resolveAutoBeamType(
  onset: number,
  chronaxie: number,
  beatChronaxie: number = AUTO_BEAM_BEAT_CHRONAXIE,
): BeamTypeEnum {
  if (chronaxie >= beatChronaxie) return BeamTypeEnum.None
  if (beatChronaxie <= 0) return BeamTypeEnum.None
  const onsetInBeat = ((onset % beatChronaxie) + beatChronaxie) % beatChronaxie
  if (onsetInBeat === 0) return BeamTypeEnum.OnlyRight
  return BeamTypeEnum.Combined
}

/** 含附点的绝对时值（与 dr-play getDuration 一致） */
export function chronaxieWithDots(chronaxie: number, dotCount = 0): number {
  let total = chronaxie
  let add = chronaxie
  for (let i = 0; i < dotCount; i++) {
    add = add / 2
    total += add
  }
  return total
}

function slotDuration(slot: StaffSlot): number {
  if ('type' in slot && slot.type === NoteSymbolTypeEnum.Rest) {
    const rest = slot as NoteRest
    return chronaxieWithDots(rest.chronaxie, rest.augmentationDot?.count ?? 0)
  }
  if (isNoteNumberSlot(slot)) {
    const num = slot as NoteNumber
    if (isSlotRestLike(num)) {
      const lead = num.notesInfo[0]
      return chronaxieWithDots(lead?.chronaxie ?? 64, lead?.augmentationDot?.count ?? 0)
    }
    const lead = num.notesInfo[0]
    return chronaxieWithDots(lead?.chronaxie ?? 64, lead?.augmentationDot?.count ?? 0)
  }
  const note = slot as NoteSymbol
  const lead = note.notesInfo[0]
  return chronaxieWithDots(lead?.chronaxie ?? 64, lead?.augmentationDot?.count ?? 0)
}

/** 小节内下标 `index` 之前各槽位时值之和（即该下标处插入/落音的 onset） */
export function computeMeasureOnsetBefore(measure: Measure, index: number): number {
  const end = Math.max(0, Math.min(index, measure.notes.length))
  let onset = 0
  for (let i = 0; i < end; i++) {
    onset += slotDuration(measure.notes[i]!)
  }
  return onset
}

/** 未显式传 beamType 时：有 onset 则自动推算，否则 None */
export function resolveDefaultBeamType(options: {
  beamType?: BeamTypeEnum
  beamOnset?: number
  chronaxie: number
  beatChronaxie?: number
}): BeamTypeEnum {
  if (options.beamType != null) return options.beamType
  if (options.beamOnset != null) {
    return resolveAutoBeamType(
      options.beamOnset,
      options.chronaxie,
      options.beatChronaxie ?? AUTO_BEAM_BEAT_CHRONAXIE,
    )
  }
  return BeamTypeEnum.None
}
