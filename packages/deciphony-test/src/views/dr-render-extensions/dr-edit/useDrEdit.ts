/**
 * 曲谱编辑扩展：音符 region 拖拽、direction 联动、添加复谱表等
 */

import {ref} from 'vue'
import type {
    Measure,
    MusicScore as MusicScoreType,
    NoteNumber,
    NotesInfo,
    NotesNumberInfo,
    NoteSymbol,
} from 'deciphony-renderer'
import {
    AccidentalTypeEnum,
    BarlineTypeEnum,
    ClefTypeEnum,
    KeySignatureTypeEnum,
    MusicScoreTypeEnum,
    NoteSymbolTypeEnum,
    TimeSignatureTypeEnum,
} from 'deciphony-renderer'
import type {DrRenderCore} from '../useDrRenderCore'
import {
    createEmptyMeasure,
    createEmptyMeasureNumber,
    createGrandStaff,
    createGrandStaffNumber,
    createSingleStaff,
    createSingleStaffNumber,
    createRest,
    createRestNumber,
    createNote,
    createNoteNumber,
    createClef,
    createBarline,
    createTimeSignature,
    createKeySignature,
} from './grandStaffTemplate'

const PX_PER_REGION = 5.5
const REGION_MIN = -11
const REGION_MAX = 19
const REGION_DIRECTION_THRESHOLD = 4

/** 简谱总音高：octaveDot*7 + syllable，范围 下八度点5点1(-34) ~ 上八度点5点7(42) */
const NUMBER_TOTAL_MIN = -34  // -5*7 + 1
const NUMBER_TOTAL_MAX = 42   // 5*7 + 7
function numberTotalToSyllableOctave(totalValue: number): {
    syllable: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5
} {
    const clamped = Math.max(NUMBER_TOTAL_MIN, Math.min(NUMBER_TOTAL_MAX, Math.round(totalValue)))
    const octaveDot = Math.max(-5, Math.min(5, Math.floor((clamped - 1) / 7))) as -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5
    const syllable = (clamped - octaveDot * 7) as number
    const syllableClamped = Math.max(1, Math.min(7, syllable)) as 1 | 2 | 3 | 4 | 5 | 6 | 7
    return {syllable: syllableClamped, octaveDot}
}

function syllableOctaveToNumberTotal(syllable: number, octaveDot: number): number {
    return octaveDot * 7 + syllable
}

function findNoteAndNotesInfoById(
    score: MusicScoreType,
    id: string
): {
  note: NoteSymbol;
  notesInfo: NotesInfo;
  measure: { notes: unknown[] };
  noteIndex: number
} | null {
  for (const gs of score.grandStaffs ?? []) {
    for (const staff of gs.staves ?? []) {
      for (const measure of staff.measures ?? []) {
        const notes = (measure.notes ?? []) as NoteSymbol[]
        for (let i = 0; i < notes.length; i++) {
          const note = notes[i]
          if (note.type !== NoteSymbolTypeEnum.Note) continue
          const parts = [note.voicePart, note.voicePart2].filter(Boolean)
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

/** 简谱：按 NotesNumberInfo.id 查找 */
function findNoteNumberAndNotesInfoById(
    score: MusicScoreType,
    id: string
): { note: NoteNumber; notesInfo: NotesNumberInfo; measure: { notes: unknown[] }; noteIndex: number } | null {
    for (const gs of score.grandStaffs ?? []) {
        for (const staff of gs.staves ?? []) {
            for (const measure of staff.measures ?? []) {
                const notes = measure.notes ?? []
                for (let i = 0; i < notes.length; i++) {
                    const note = notes[i]
                    if (!('voicePart' in note)) continue
                    const n = note as NoteNumber
                    for (const ni of n.voicePart?.notesInfo ?? []) {
                        if (ni.id === id) return {note: n, notesInfo: ni, measure, noteIndex: i}
                    }
                }
            }
        }
    }
    return null
}

/** 简谱休止符：NoteNumber 且 syllable 为 0 */
function findRestByIdNumber(score: MusicScoreType, id: string): {
    measure: { notes: unknown[] };
    noteIndex: number;
    note: NoteNumber
} | null {
    for (const gs of score.grandStaffs ?? []) {
        for (const staff of gs.staves ?? []) {
            for (const measure of staff.measures ?? []) {
                const notes = measure.notes ?? []
                for (let i = 0; i < notes.length; i++) {
                    const n = notes[i] as NoteNumber
                    if (!('voicePart' in n)) continue
                    const first = n.voicePart?.notesInfo?.[0]
                    if (first?.syllable === 0 && n.id === id) return {measure, noteIndex: i, note: n}
                }
            }
        }
    }
    return null
}

function findMeasureBySymbolId(
    score: MusicScoreType,
    targetId: string,
    tag: 'clef_f' | 'clef_b' | 'keySignature_f' | 'keySignature_b' | 'timeSignature_f' | 'timeSignature_b' | 'barline_f' | 'barline_b'
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
                if (tag === 'barline_f' && measure.barline_f?.id === targetId) return measure
                if (tag === 'barline_b' && measure.barline_b?.id === targetId) return measure
            }
        }
    }
    return null
}

const frame = {relativeH: 0, relativeY: 0, relativeW: 0, relativeX: 0}
const DELETABLE_TAGS = ['clef_f', 'clef_b', 'keySignature_f', 'keySignature_b', 'timeSignature_f', 'timeSignature_b', 'barline_f', 'barline_b', 'rest', 'noteHead'] as const

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

    type DragState =
        | { targetId: string; startSvgY: number; mode: 'region'; startRegion: number }
        | { targetId: string; startSvgY: number; mode: 'syllable'; startTotalValue: number }
    const dragState = ref<DragState | null>(null)

    function isNumberNotation() {
        return musicScoreData.value?.type === MusicScoreTypeEnum.NumberNotation
    }

    registerPointerDown((e, ctx) => {
        if (ctx.tag === 'slot') return
        applyHighlight()
        if (ctx.tag !== 'noteHead' || !ctx.targetId) return
        const pt = ctx.getSvgPoint(e)
        if (!pt) return
        if (isNumberNotation()) {
            const found = findNoteNumberAndNotesInfoById(musicScoreData.value, ctx.targetId)
            if (!found) return
            const {notesInfo} = found
            if (notesInfo.syllable === 0 || notesInfo.syllable === 'X') return
            const startTotalValue = syllableOctaveToNumberTotal(
                notesInfo.syllable as number,
                notesInfo.octaveDot ?? 0
            )
            dragState.value = {targetId: ctx.targetId, startSvgY: pt.y, mode: 'syllable', startTotalValue}
            ;(e.currentTarget as Element)?.setPointerCapture?.(e.pointerId)
        } else {
            const found = findNoteAndNotesInfoById(musicScoreData.value, ctx.targetId)
            if (pt && found) {
                dragState.value = {
                    targetId: ctx.targetId,
                    startSvgY: pt.y,
                    mode: 'region',
                    startRegion: found.notesInfo.region
                }
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
        const deltaValue = Math.round(-deltaY / PX_PER_REGION)
        if (state.mode === 'region') {
            const newRegion = Math.round(state.startRegion - deltaY / PX_PER_REGION)
            if (newRegion > REGION_MAX || newRegion < REGION_MIN) return
            const found = findNoteAndNotesInfoById(musicScoreData.value, state.targetId)
            if (found && found.notesInfo.region !== newRegion && found.note.type === NoteSymbolTypeEnum.Note) {
                found.notesInfo.region = newRegion
                found.note.direction = newRegion > REGION_DIRECTION_THRESHOLD ? 'down' : 'up'
                nextTick(applyHighlight)
            }
        } else {
            const newTotalValue = state.startTotalValue + deltaValue
            const {syllable, octaveDot} = numberTotalToSyllableOctave(newTotalValue)
            const found = findNoteNumberAndNotesInfoById(musicScoreData.value, state.targetId)
            if (!found) return
            if (found.notesInfo.syllable === syllable && (found.notesInfo.octaveDot ?? 0) === octaveDot) return
            found.notesInfo.syllable = syllable
            found.notesInfo.octaveDot = octaveDot
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
    const note = musicScoreData.value.grandStaffs[0]?.staves[0]?.measures[0]?.notes[0] as NoteSymbol | undefined
    if (!note || !('type' in note) || note.type !== NoteSymbolTypeEnum.Note) return
    const ni = note.voicePart.notesInfo[0]
    if (!ni) return
    ni.region = 8
    note.direction = ni.region > REGION_DIRECTION_THRESHOLD ? 'down' : 'up'
  }

    function addGrandStaff() {
        const gs = isNumberNotation() ? createGrandStaffNumber() : createGrandStaff()
        musicScoreData.value.grandStaffs.push(gs)
    }

    function addSingleStaff(afterStaffId: string) {
        const score = musicScoreData.value
        for (const gs of score.grandStaffs ?? []) {
            const idx = gs.staves.findIndex((s) => s.id === afterStaffId)
            if (idx >= 0) {
                const newStaff = isNumberNotation() ? createSingleStaffNumber() : createSingleStaff()
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
            const found = isNumberNotation()
                ? findRestByIdNumber(musicScoreData.value, targetId)
                : findRestById(musicScoreData.value, targetId)
            return (found?.measure ?? null) as Measure | null
        }
        if (tag === 'noteHead') {
            const found = isNumberNotation()
                ? findNoteNumberAndNotesInfoById(musicScoreData.value, targetId)
                : findNoteAndNotesInfoById(musicScoreData.value, targetId)
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
        if (isNumberNotation()) return
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
        if (!m) return
        m.barline_b = createBarline(barlineType)
    }

    function addRestToMeasure(measureId: string, chronaxie: number) {
        const m = findMeasureById(measureId)
        if (!m || !('notes' in m)) return
        const notes = m.notes as unknown[]
        if (!Array.isArray(notes)) return
        const chronaxieC = chronaxie as import('deciphony-renderer').Chronaxie
        notes.push(isNumberNotation() ? createRestNumber(chronaxieC) : createRest(chronaxieC))
    }

    function addNoteToMeasure(measureId: string, chronaxie: number, regionOrSyllable = 4) {
        const m = findMeasureById(measureId)
        if (!m || !('notes' in m)) return
        const notes = m.notes as unknown[]
        if (!Array.isArray(notes)) return
        const chronaxieC = chronaxie as import('deciphony-renderer').Chronaxie
        if (isNumberNotation()) {
            const syllable = (regionOrSyllable >= 1 && regionOrSyllable <= 7 ? regionOrSyllable : 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
            notes.push(createNoteNumber(syllable, chronaxieC))
        } else {
            notes.push(createNote(regionOrSyllable as number, chronaxieC))
        }
    }

    /** 在选中小节后添加新的空小节 */
    function addMeasureAfter(measureId: string) {
        const m = findMeasureById(measureId)
        if (!m) return
        const createEmpty = isNumberNotation() ? createEmptyMeasureNumber : createEmptyMeasure
        for (const gs of musicScoreData.value.grandStaffs ?? []) {
            for (const staff of gs.staves ?? []) {
                const idx = staff.measures?.findIndex((x) => x.id === m.id)
                if (idx !== undefined && idx >= 0) {
                    staff.measures!.splice(idx + 1, 0, createEmpty(m))
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
    const note = found.note
    if (note.type !== NoteSymbolTypeEnum.Note) return
    const vp = note.voicePart.notesInfo.some((n) => n.id === notesInfoId) ? note.voicePart : note.voicePart2
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
    if (isNumberNotation()) {
      const found = findNoteNumberAndNotesInfoById(musicScoreData.value, notesInfoId)
      if (!found) return { augmentationDotCount: 0, accidentalType: '' }
      const dot = (found.note.voicePart.augmentationDot?.count as 0 | 1 | 2 | 3) ?? 0
      const acc = found.notesInfo.accidental?.type ?? ''
      return { augmentationDotCount: dot, accidentalType: acc }
    }
    const found = findNoteAndNotesInfoById(musicScoreData.value, notesInfoId)
    if (!found) return { augmentationDotCount: 0, accidentalType: '' }
    const note = found.note
    if (note.type !== NoteSymbolTypeEnum.Note) return { augmentationDotCount: 0, accidentalType: '' }
    const vp = note.voicePart.notesInfo.some((n) => n.id === notesInfoId) ? note.voicePart : note.voicePart2
    const dot = (vp?.augmentationDot?.count as 0 | 1 | 2 | 3) ?? 0
    const acc = found.notesInfo.accidental?.type ?? ''
    return { augmentationDotCount: dot, accidentalType: acc }
  }

    /** 更新音符变音符号：null=无，否则为 AccidentalTypeEnum */
    function updateNoteAccidental(notesInfoId: string, type: AccidentalTypeEnum | null) {
        if (isNumberNotation()) {
            const found = findNoteNumberAndNotesInfoById(musicScoreData.value, notesInfoId)
            if (!found) return
            if (type === null) {
                delete found.notesInfo.accidental
            } else {
                found.notesInfo.accidental = {
                    ...frame,
                    id: crypto.randomUUID(),
                    type,
                    widthRatio: 0,
                    widthRatioForMeasure: 0,
                }
            }
        } else {
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
        }
        nextTick(applyHighlight)
    }

  /** 选中音符或休止符时，返回 { type, measure, note, chronaxie } */
  function findSelectedNoteOrRest(targetId: string, tag: string) {
    if (tag === 'noteHead') {
      if (isNumberNotation()) {
        const found = findNoteNumberAndNotesInfoById(musicScoreData.value, targetId)
        if (!found) return null
        const chronaxie = found.note.voicePart.chronaxie ?? 64
        return {type: 'note' as const, measure: found.measure, note: found.note, chronaxie}
      }
      const found = findNoteAndNotesInfoById(musicScoreData.value, targetId)
      if (!found) return null
      const note = found.note
      if (note.type !== NoteSymbolTypeEnum.Note) return null
      const chronaxie = note.voicePart?.chronaxie ?? note.voicePart2?.chronaxie ?? 64
      return {type: 'note' as const, measure: found.measure, note: found.note, chronaxie}
    }
    if (tag === 'rest') {
      if (isNumberNotation()) {
        const found = findRestByIdNumber(musicScoreData.value, targetId)
        if (!found) return null
        const chronaxie = found.note.voicePart.chronaxie ?? 64
        return {type: 'rest' as const, measure: found.measure, note: found.note, chronaxie}
      }
      const found = findRestById(musicScoreData.value, targetId)
      if (!found) return null
      const chronaxie = found.note.type === NoteSymbolTypeEnum.Rest ? found.note.chronaxie : 64
      return {type: 'rest' as const, measure: found.measure, note: found.note, chronaxie}
    }
    return null
  }

  /** 更新音符或休止符的 chronaxie */
  function updateSymbolChronaxie(targetId: string, tag: string, chronaxie: import('deciphony-renderer').Chronaxie) {
    if (tag === 'noteHead') {
      if (isNumberNotation()) {
        const found = findNoteNumberAndNotesInfoById(musicScoreData.value, targetId)
        if (!found) return
        found.note.voicePart.chronaxie = chronaxie
      } else {
        const found = findNoteAndNotesInfoById(musicScoreData.value, targetId)
        if (!found || found.note.type !== NoteSymbolTypeEnum.Note) return
        if (found.note.voicePart) found.note.voicePart.chronaxie = chronaxie
        if (found.note.voicePart2) found.note.voicePart2.chronaxie = chronaxie
      }
    } else if (tag === 'rest') {
      if (isNumberNotation()) {
        const found = findRestByIdNumber(musicScoreData.value, targetId)
        if (!found) return
        found.note.voicePart.chronaxie = chronaxie
      } else {
        const found = findRestById(musicScoreData.value, targetId)
        if (!found || found.note.type !== NoteSymbolTypeEnum.Rest) return
        found.note.chronaxie = chronaxie
      }
    }
    nextTick(applyHighlight)
  }

    /** 判断当前选中是否为可删除符号 */
    function isDeletableSymbol(targetId: string, tag: string) {
        if (!targetId || !(DELETABLE_TAGS as readonly string[]).includes(tag)) return false
        if (tag === 'noteHead' || tag === 'rest') {
            return isNumberNotation()
                ? (tag === 'rest' ? !!findRestByIdNumber(musicScoreData.value, targetId) : !!findNoteNumberAndNotesInfoById(musicScoreData.value, targetId))
                : (tag === 'rest' ? !!findRestById(musicScoreData.value, targetId) : !!findNoteAndNotesInfoById(musicScoreData.value, targetId))
        }
        if (isNumberNotation() && (tag === 'clef_f' || tag === 'clef_b')) return false
        return !!findMeasureBySymbolId(musicScoreData.value, targetId, tag as 'clef_f' | 'clef_b' | 'keySignature_f' | 'keySignature_b' | 'timeSignature_f' | 'timeSignature_b' | 'barline_f' | 'barline_b')
    }

    /** 删除选中符号。小节线“删除”实为改为单线 */
    function deleteSymbol(targetId: string, tag: string) {
        if (tag === 'barline_f') {
            const m = findMeasureBySymbolId(musicScoreData.value, targetId, 'barline_f')
            if (m) m.barline_f = createBarline(BarlineTypeEnum.Single_barline)
            nextTick(applyHighlight)
            return
        }
        if (tag === 'barline_b') {
            const m = findMeasureBySymbolId(musicScoreData.value, targetId, 'barline_b')
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
            const found = isNumberNotation() ? findRestByIdNumber(musicScoreData.value, targetId) : findRestById(musicScoreData.value, targetId)
            if (found) {
                found.measure.notes.splice(found.noteIndex, 1)
                nextTick(applyHighlight)
            }
            return
        }
        if (tag === 'noteHead') {
            const found = isNumberNotation() ? findNoteNumberAndNotesInfoById(musicScoreData.value, targetId) : findNoteAndNotesInfoById(musicScoreData.value, targetId)
            if (found) {
                found.measure.notes.splice(found.noteIndex, 1)
                nextTick(applyHighlight)
            }
        }
    }

    return {
        isNumberNotation,
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
