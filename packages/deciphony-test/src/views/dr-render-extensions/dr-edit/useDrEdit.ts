/**
 * 曲谱编辑扩展：音符 region 拖拽、direction 联动、添加复谱表等
 */

import {ref} from 'vue'
import type {Measure, MusicScore as MusicScoreType, NotesInfo, NoteSymbol} from 'deciphony-renderer'
import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from 'deciphony-renderer'
import type {DrRenderCore} from '../useDrRenderCore'
import {
  createEmptyMeasure,
  createGrandStaff,
  createSingleStaff,
  createRest,
  createNote,
  createClef,
  createBarline,
  createTimeSignature,
  createKeySignature,
} from './grandStaffTemplate'

const PX_PER_REGION = 5.5
const REGION_MIN = -11
const REGION_MAX = 19
const REGION_DIRECTION_THRESHOLD = 4

function findNoteAndNotesInfoById(
  score: MusicScoreType,
  id: string
): {
  note: { direction?: 'up' | 'down' };
  notesInfo: NotesInfo;
  measure: { notes: unknown[] };
  noteIndex: number
} | null {
  for (const gs of score.grandStaffs ?? []) {
    for (const staff of gs.staves ?? []) {
      for (const measure of staff.measures ?? []) {
        const notes = measure.notes ?? []
        for (let i = 0; i < notes.length; i++) {
          const note = notes[i]
          if (!('voicePart1' in note)) continue
          const parts = [note.voicePart1, (note as { voicePart2?: typeof note.voicePart1 }).voicePart2].filter(Boolean)
          for (const vp of parts) {
            if (!vp) continue
            for (const ni of vp.notesInfo ?? []) {
              if (ni.id === id) return {note, notesInfo: ni, measure, noteIndex: i}
            }
          }
        }
      }
    }
  }
  return null
}

function findRestById(score: MusicScoreType, id: string): {
  measure: { notes: unknown[] };
  noteIndex: number;
  note: NoteSymbol
} | null {
  for (const gs of score.grandStaffs ?? []) {
    for (const staff of gs.staves ?? []) {
      for (const measure of staff.measures ?? []) {
        const notes = measure.notes ?? []
        for (let i = 0; i < notes.length; i++) {
          const n = notes[i] as NoteSymbol
          if (n.type === NoteSymbolTypeEnum.Rest && n.id === id) return {measure, noteIndex: i, note: n}
        }
      }
    }
  }
  return null
}

function findMeasureBySymbolId(
  score: MusicScoreType,
  targetId: string,
  tag: 'clef_f' | 'clef_b' | 'keySignature_f' | 'keySignature_b' | 'timeSignature_f' | 'timeSignature_b' | 'barline'
) {
  for (const gs of score.grandStaffs ?? []) {
    for (const staff of gs.staves ?? []) {
      for (const measure of staff.measures ?? []) {
        if (tag === 'clef_f' && measure.clef_f?.id === targetId) return measure
        if (tag === 'clef_b' && measure.clef_b?.id === targetId) return measure
        if (tag === 'keySignature_f' && measure.keySignature_f?.id === targetId) return measure
        if (tag === 'keySignature_b' && measure.keySignature_b?.id === targetId) return measure
        if (tag === 'timeSignature_f' && measure.timeSignature_f?.id === targetId) return measure
        if (tag === 'timeSignature_b' && measure.timeSignature_b?.id === targetId) return measure
        if (tag === 'barline' && measure.barline?.id === targetId) return measure
      }
    }
  }
  return null
}

const frame = { relativeH: 0, relativeY: 0, relativeW: 0, relativeX: 0 }
const DELETABLE_TAGS = ['clef_f', 'clef_b', 'keySignature_f', 'keySignature_b', 'timeSignature_f', 'timeSignature_b', 'barline', 'rest', 'noteHead'] as const

export function useDrEdit(core: DrRenderCore) {
  const {
    msRef,
    musicScoreData,
    applyHighlight,
    getSvgPoint,
    registerPointerDown,
    registerPointerMove,
    registerPointerUp,
    nextTick
  } = core

  const dragState = ref<{ targetId: string; startRegion: number; startSvgY: number } | null>(null)

  registerPointerDown((e, ctx) => {
    if (ctx.tag === 'slot') return
    applyHighlight()
    if (ctx.tag === 'noteHead' && ctx.targetId) {
      const pt = ctx.getSvgPoint(e)
      const found = findNoteAndNotesInfoById(musicScoreData.value, ctx.targetId)
      if (pt && found) {
        dragState.value = {targetId: ctx.targetId, startRegion: found.notesInfo.region, startSvgY: pt.y}
        ;(e.currentTarget as Element)?.setPointerCapture?.(e.pointerId)
      }
    }
  })

  registerPointerMove((e, ctx) => {
    const state = dragState.value
    if (!state) return
    const pt = ctx.getSvgPoint(e)
    if (!pt) return
    const deltaY = pt.y - state.startSvgY
    const newRegion = Math.round(state.startRegion - deltaY / PX_PER_REGION)
    if (newRegion > REGION_MAX || newRegion < REGION_MIN) return
    const found = findNoteAndNotesInfoById(musicScoreData.value, state.targetId)
    if (found && found.notesInfo.region !== newRegion) {
      found.notesInfo.region = newRegion
      found.note.direction = newRegion > REGION_DIRECTION_THRESHOLD ? 'down' : 'up'
      nextTick(applyHighlight)
    }
  })

  registerPointerUp((e) => {
    if (dragState.value) {
      ;(e.currentTarget as Element)?.releasePointerCapture?.(e.pointerId)
      dragState.value = null
    }
  })

  function test() {
    const note = musicScoreData.value.grandStaffs[0]?.staves[0]?.measures[0]?.notes[0]
    if (!note || !('voicePart1' in note)) return
    const ni = note.voicePart1.notesInfo[0]
    if (!ni) return
    ni.region = 8
    note.direction = ni.region > REGION_DIRECTION_THRESHOLD ? 'down' : 'up'
  }

  function addGrandStaff() {
    const gs = createGrandStaff()
    musicScoreData.value.grandStaffs.push(gs)
  }

  function addSingleStaff(afterStaffId: string) {
    const score = musicScoreData.value
    for (const gs of score.grandStaffs ?? []) {
      const idx = gs.staves.findIndex((s) => s.id === afterStaffId)
      if (idx >= 0) {
        const newStaff = createSingleStaff()
        gs.staves.splice(idx + 1, 0, newStaff)
        return
      }
    }
  }

  /** 根据点击的 targetId 和 tag 查找所属小节；slot m-xxx、或小节内任意符号（谱号、拍号、调号、小节线、音符、休止符）均视为选中该小节 */
  function findMeasureBySelection(targetId: string, tag: string): Measure | null {
    if (!targetId) return null
    if (targetId.startsWith('m-') || tag === 'measure') return findMeasureById(targetId)
    if (
      tag === 'clef_f' || tag === 'clef_b' || tag === 'keySignature_f' || tag === 'keySignature_b' ||
      tag === 'timeSignature_f' || tag === 'timeSignature_b' || tag === 'barline'
    ) {
      return findMeasureBySymbolId(musicScoreData.value, targetId, tag as Parameters<typeof findMeasureBySymbolId>[2])
    }
    if (tag === 'rest') {
      const found = findRestById(musicScoreData.value, targetId)
      return (found?.measure ?? null) as Measure | null
    }
    if (tag === 'noteHead') {
      const found = findNoteAndNotesInfoById(musicScoreData.value, targetId)
      return (found?.measure ?? null) as Measure | null
    }
    return null
  }

  function findMeasureById(measureId: string) {
    const id = measureId.startsWith('m-') ? measureId.slice(2) : measureId
    for (const gs of musicScoreData.value.grandStaffs ?? []) {
      for (const staff of gs.staves ?? []) {
        const m = staff.measures?.find((x) => x.id === id)
        if (m) return m
      }
    }
    return null
  }

  function updateMeasureClef(measureId: string, clefType: ClefTypeEnum) {
    const m = findMeasureById(measureId)
    if (!m) return
    m.clef_f = createClef(clefType)
  }

  function updateMeasureKeySignature(measureId: string, type: KeySignatureTypeEnum) {
    const m = findMeasureById(measureId)
    if (!m) return
    m.keySignature_f = createKeySignature(type)
  }

  function updateMeasureTimeSignature(measureId: string, type: TimeSignatureTypeEnum) {
    const m = findMeasureById(measureId)
    if (!m) return
    m.timeSignature_f = createTimeSignature(type)
  }

  function updateMeasureBarline(measureId: string, barlineType: BarlineTypeEnum) {
    const m = findMeasureById(measureId)
    if (!m || !m.barline) return
    m.barline = createBarline(barlineType)
  }

  function addRestToMeasure(measureId: string, chronaxie: number) {
    const m = findMeasureById(measureId)
    if (!m || !('notes' in m)) return
    const notes = m.notes as Array<{ voicePart1?: { chronaxie: number } }>
    if (!Array.isArray(notes)) return
    notes.push(createRest(chronaxie as import('deciphony-renderer').Chronaxie))
  }

  function addNoteToMeasure(measureId: string, chronaxie: number, region = 4) {
    const m = findMeasureById(measureId)
    if (!m || !('notes' in m)) return
    const notes = m.notes as Array<unknown>
    if (!Array.isArray(notes)) return
    notes.push(createNote(region, chronaxie as import('deciphony-renderer').Chronaxie))
  }

  /** 在选中小节后添加新的空小节 */
  function addMeasureAfter(measureId: string) {
    const m = findMeasureById(measureId)
    if (!m) return
    for (const gs of musicScoreData.value.grandStaffs ?? []) {
      for (const staff of gs.staves ?? []) {
        const idx = staff.measures?.findIndex((x) => x.id === m.id)
        if (idx !== undefined && idx >= 0) {
          const newMeasure = createEmptyMeasure(m)
          staff.measures!.splice(idx + 1, 0, newMeasure)
          nextTick(applyHighlight)
          return
        }
      }
    }
  }

  /** 更新音符附点：0=无，1/2/3=附点数量 */
  function updateNoteAugmentationDot(notesInfoId: string, count: 0 | 1 | 2 | 3) {
    const found = findNoteAndNotesInfoById(musicScoreData.value, notesInfoId)
    if (!found) return
    const note = found.note as { voicePart1?: { notesInfo: { id: string }[]; augmentationDot?: unknown }; voicePart2?: { notesInfo: { id: string }[]; augmentationDot?: unknown } }
    const vp = note.voicePart1?.notesInfo?.some((n: { id: string }) => n.id === notesInfoId) ? note.voicePart1 : note.voicePart2
    if (!vp) return
    if (count === 0) {
      delete vp.augmentationDot
    } else {
      vp.augmentationDot = {
        ...frame,
        id: crypto.randomUUID(),
        count: count as 1 | 2 | 3,
        widthRatio: count === 1 ? 2 : count === 2 ? 3 : 4,
        widthRatioForMeasure: count === 1 ? 4 : count === 2 ? 6.5 : 9,
      }
    }
    nextTick(applyHighlight)
  }

  /** 获取选中音符的附点和变音符号当前值（用于 UI 展示） */
  function getSelectedNoteOptions(notesInfoId: string): { augmentationDotCount: 0 | 1 | 2 | 3; accidentalType: string } {
    const found = findNoteAndNotesInfoById(musicScoreData.value, notesInfoId)
    if (!found) return { augmentationDotCount: 0, accidentalType: '' }
    const note = found.note as { voicePart1?: { notesInfo: { id: string }[]; augmentationDot?: { count: number } }; voicePart2?: { notesInfo: { id: string }[]; augmentationDot?: { count: number } } }
    const vp = note.voicePart1?.notesInfo?.some((n: { id: string }) => n.id === notesInfoId) ? note.voicePart1 : note.voicePart2
    const dot = (vp?.augmentationDot?.count as 0 | 1 | 2 | 3) ?? 0
    const acc = found.notesInfo.accidental?.type ?? ''
    return { augmentationDotCount: dot, accidentalType: acc }
  }

  /** 更新音符变音符号：null=无，否则为 AccidentalTypeEnum */
  function updateNoteAccidental(notesInfoId: string, type: AccidentalTypeEnum | null) {
    const found = findNoteAndNotesInfoById(musicScoreData.value, notesInfoId)
    if (!found) return
    if (type === null) {
      delete found.notesInfo.accidental
    } else {
      found.notesInfo.accidental = {
        ...frame,
        id: crypto.randomUUID(),
        type,
        widthRatio: 4,
        widthRatioForMeasure: 4,
      }
    }
    nextTick(applyHighlight)
  }

  /** 选中音符或休止符时，返回 { type, measure, note, chronaxie } */
  function findSelectedNoteOrRest(targetId: string, tag: string) {
    if (tag === 'noteHead') {
      const found = findNoteAndNotesInfoById(musicScoreData.value, targetId)
      if (!found) return null
      const note = found.note as { voicePart1?: { chronaxie: number }; voicePart2?: { chronaxie: number } }
      const chronaxie = note.voicePart1?.chronaxie ?? note.voicePart2?.chronaxie ?? 64
      return {type: 'note' as const, measure: found.measure, note: found.note, chronaxie}
    }
    if (tag === 'rest') {
      const found = findRestById(musicScoreData.value, targetId)
      if (!found) return null
      const chronaxie = found.note.voicePart1?.chronaxie ?? 64
      return {type: 'rest' as const, measure: found.measure, note: found.note, chronaxie}
    }
    return null
  }

  /** 更新音符或休止符的 chronaxie */
  function updateSymbolChronaxie(targetId: string, tag: string, chronaxie: import('deciphony-renderer').Chronaxie) {
    if (tag === 'noteHead') {
      const found = findNoteAndNotesInfoById(musicScoreData.value, targetId)
      if (!found) return
      const note = found.note as { voicePart1?: { chronaxie: number }; voicePart2?: { chronaxie: number } }
      if (note.voicePart1) note.voicePart1.chronaxie = chronaxie
      if (note.voicePart2) note.voicePart2.chronaxie = chronaxie
    } else if (tag === 'rest') {
      const found = findRestById(musicScoreData.value, targetId)
      if (!found) return
      if (found.note.voicePart1) found.note.voicePart1.chronaxie = chronaxie
    }
    nextTick(applyHighlight)
  }

  /** 判断当前选中是否为可删除符号 */
  function isDeletableSymbol(targetId: string, tag: string) {
    if (!targetId || !(DELETABLE_TAGS as readonly string[]).includes(tag)) return false
    if (tag === 'noteHead' || tag === 'rest') {
      return tag === 'rest' ? !!findRestById(musicScoreData.value, targetId) : !!findNoteAndNotesInfoById(musicScoreData.value, targetId)
    }
    return !!findMeasureBySymbolId(musicScoreData.value, targetId, tag as 'clef_f' | 'clef_b' | 'keySignature_f' | 'keySignature_b' | 'timeSignature_f' | 'timeSignature_b' | 'barline')
  }

  /** 删除选中符号。小节线“删除”实为改为单线 */
  function deleteSymbol(targetId: string, tag: string) {
    if (tag === 'barline') {
      const m = findMeasureBySymbolId(musicScoreData.value, targetId, 'barline')
      if (m) updateMeasureBarline(m.id, BarlineTypeEnum.Single_barline)
      return
    }
    if (tag === 'clef_f' || tag === 'clef_b') {
      const m = findMeasureBySymbolId(musicScoreData.value, targetId, tag as 'clef_f' | 'clef_b')
      if (m) delete (m as Record<string, unknown>)[tag]
      nextTick(applyHighlight)
      return
    }
    if (tag === 'keySignature_f' || tag === 'keySignature_b') {
      const m = findMeasureBySymbolId(musicScoreData.value, targetId, tag as 'keySignature_f' | 'keySignature_b')
      if (m) delete (m as Record<string, unknown>)[tag]
      nextTick(applyHighlight)
      return
    }
    if (tag === 'timeSignature_f' || tag === 'timeSignature_b') {
      const m = findMeasureBySymbolId(musicScoreData.value, targetId, tag as 'timeSignature_f' | 'timeSignature_b')
      if (m) delete (m as Record<string, unknown>)[tag]
      nextTick(applyHighlight)
      return
    }
    if (tag === 'rest') {
      const found = findRestById(musicScoreData.value, targetId)
      if (found) {
        found.measure.notes.splice(found.noteIndex, 1)
        nextTick(applyHighlight)
      }
      return
    }
    if (tag === 'noteHead') {
      const found = findNoteAndNotesInfoById(musicScoreData.value, targetId)
      if (found) {
        found.measure.notes.splice(found.noteIndex, 1)
        nextTick(applyHighlight)
      }
    }
  }

  return {
    test,
    addGrandStaff,
    addSingleStaff,
    addMeasureAfter,
    findMeasureById,
    findMeasureBySelection,
    updateMeasureClef,
    updateMeasureKeySignature,
    updateMeasureTimeSignature,
    updateMeasureBarline,
    addRestToMeasure,
    addNoteToMeasure,
    findSelectedNoteOrRest,
    updateSymbolChronaxie,
    getSelectedNoteOptions,
    updateNoteAugmentationDot,
    updateNoteAccidental,
    isDeletableSymbol,
    deleteSymbol,
  }
}
