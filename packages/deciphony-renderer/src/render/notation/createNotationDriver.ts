import {
  MusicScoreTypeEnum,
  fretboardStringCount,
  isFretboardScoreType,
} from '@/enums/musicScoreEnum'
import type {SkinPack} from '@/types/common'
import type {Measure, MeasureNoteSlot, MusicScore, SingleStaff} from '@/types/MusicScoreType'
import {defaultSkin} from '@/skins/defaultSkin'
import {withEmptySkinFallback} from '@/skins/emptySkin'
import {
  mergedMeasureWidthRatio,
  type ColumnLayoutSource,
  type MeasureColumnLayout,
} from '@/render/layout/measureColumnLayout'
import {getMeasureSlots, getMeasureVoices} from '@/utils/measureNotes'
import {resolveStaffType} from '@/render/staffType'
import type {NotationDriver, NotationSkin, StaffAnchor} from './types'

import {StandardStaffSkinKeyEnum} from '@/standardStaff/enums/standardStaffSkinKeyEnum'
import {getMeasureWidthRatio as standardOwnRatio} from '@/standardStaff/render/utils/note'
import {
  getBarlineFXInMeasure as standardBarlineFX,
  getBarlineXInMeasure as standardBarlineX,
} from '@/standardStaff/render/symbol/renderSymbol'
import {
  getBracketSkinKey as standardBracketKey,
  getLinkedBarlineSkinKey as standardLinkedKey,
} from '@/standardStaff/render/utils/skinKey'
import {
  computeStandardMeasureFixedWidths,
  createStandardStaffColumnLayoutAdapter,
} from '@/standardStaff/render/layout/measureColumnLayoutAdapter'

import {NumberNotationSkinKeyEnum} from '@/numberNotation/enums/numberNotationSkinKeyEnum'
import {getMeasureWidthRatio as numberOwnRatio} from '@/numberNotation/render/utils/note'
import {
  getBarlineFXInMeasure as numberBarlineFX,
  getBarlineXInMeasure as numberBarlineX,
} from '@/numberNotation/render/symbol/renderSymbol'
import {
  getBracketSkinKey as numberBracketKey,
  getLinkedBarlineSkinKey as numberLinkedKey,
} from '@/numberNotation/render/utils/skinKey'
import {
  computeNumberNotationMeasureFixedWidths,
  createNumberNotationColumnLayoutAdapter,
} from '@/numberNotation/render/layout/measureColumnLayoutAdapter'

import {Tab6SkinKeyEnum} from '@/tab6/enums/tab6SkinKeyEnum'
import {getMeasureWidthRatio as tab6OwnRatio} from '@/tab6/render/utils/note'
import {
  getBarlineFXInMeasure as tab6BarlineFX,
  getBarlineXInMeasure as tab6BarlineX,
} from '@/tab6/render/symbol/renderSymbol'
import {
  getBracketSkinKey as tab6BracketKey,
  getLinkedBarlineSkinKey as tab6LinkedKey,
} from '@/tab6/render/utils/skinKey'
import {
  computeStandardMeasureFixedWidths as tab6Fixed,
  createTab6ColumnLayoutAdapter as tab6Adapter,
} from '@/tab6/render/layout/measureColumnLayoutAdapter'

import {getMeasureWidthRatio as tab4OwnRatio} from '@/tab4/render/utils/note'
import {
  getBarlineFXInMeasure as tab4BarlineFX,
  getBarlineXInMeasure as tab4BarlineX,
} from '@/tab4/render/symbol/renderSymbol'
import {
  getBracketSkinKey as tab4BracketKey,
  getLinkedBarlineSkinKey as tab4LinkedKey,
} from '@/tab4/render/utils/skinKey'
import {
  computeStandardMeasureFixedWidths as tab4Fixed,
  createTab6ColumnLayoutAdapter as tab4Adapter,
} from '@/tab4/render/layout/measureColumnLayoutAdapter'

import {getMeasureWidthRatio as tab5OwnRatio} from '@/tab5/render/utils/note'
import {
  getBarlineFXInMeasure as tab5BarlineFX,
  getBarlineXInMeasure as tab5BarlineX,
} from '@/tab5/render/symbol/renderSymbol'
import {
  getBracketSkinKey as tab5BracketKey,
  getLinkedBarlineSkinKey as tab5LinkedKey,
} from '@/tab5/render/utils/skinKey'
import {
  computeStandardMeasureFixedWidths as tab5Fixed,
  createTab6ColumnLayoutAdapter as tab5Adapter,
} from '@/tab5/render/layout/measureColumnLayoutAdapter'

import {DrumNotationSkinKeyEnum} from '@/drumNotation/enums/drumNotationSkinKeyEnum'
import {getMeasureWidthRatio as drumOwnRatio} from '@/drumNotation/render/utils/note'
import {
  getBarlineFXInMeasure as drumBarlineFX,
  getBarlineXInMeasure as drumBarlineX,
} from '@/drumNotation/render/symbol/renderSymbol'
import {
  getBracketSkinKey as drumBracketKey,
  getLinkedBarlineSkinKey as drumLinkedKey,
} from '@/drumNotation/render/utils/skinKey'
import {
  computeDrumMeasureFixedWidths,
  createDrumColumnLayoutAdapter,
  drumMeasureWidthRatio,
} from '@/drumNotation/render/layout/measureColumnLayoutAdapter'
import {computeLongRestRoles, longRestShowsPrefix, longRestShowsSuffix} from '@/drumNotation/render/utils/longRest'
import type {DrumMeasureColumnLayout, DrumVoice} from '@/drumNotation/render/types'
import type {DrumNotationSkinPack, Tab6SkinPack} from '@/types/common'

function asSkin<T extends object>(pack: T): NotationSkin {
  return withEmptySkinFallback(pack) as unknown as NotationSkin
}

function showsOwnBarline(measure: Measure, side: 'f' | 'b'): boolean {
  return side === 'f' ? !!measure.barline_f : !!measure.barline_b
}

function packSingle(layouts: (MeasureColumnLayout | null)[]): MeasureColumnLayout | null {
  return layouts[0] ?? null
}

type PitchedApi = {
  skin: NotationSkin
  measureKey: NotationDriver['measureSkinKey']
  measureHeight: number
  measureLineWidth: number
  own: (measure: Measure) => number
  adapter: ColumnLayoutSource['adapter']
  fixed: (measure: Measure) => { prefixW: number; suffixW: number }
  barlineFX: (measure: Measure, measureX: number) => number
  barlineX: (measure: Measure, measureX: number, measureWidth: number) => number
  linkedKey: NotationDriver['linkedBarlineKey']
  bracketKey: NotationDriver['bracketKey']
}

function pitchedDriver(type: MusicScoreTypeEnum, api: PitchedApi): NotationDriver {
  const ratio = (measures: (Measure | null | undefined)[]) =>
    mergedMeasureWidthRatio(measures, api.adapter, (measure) => api.own(measure))
  return {
    type,
    skin: api.skin,
    measureHeight: api.measureHeight,
    measureLineWidth: api.measureLineWidth,
    measureSkinKey: api.measureKey,
    ownWidthRatio: (measure) => api.own(measure),
    unlinkedWidthRatio: (measure) => ratio([measure]),
    participants: (measure) => [{measure, adapter: api.adapter}],
    fixedWidths: (measure) => api.fixed(measure),
    showsBarline: (measure, _index, side) => showsOwnBarline(measure, side),
    barlineFX: (measure, measureX) => api.barlineFX(measure, measureX),
    barlineX: (measure, measureX, measureWidth) => api.barlineX(measure, measureX, measureWidth),
    linkedBarlineKey: api.linkedKey,
    bracketKey: api.bracketKey,
    packLayouts: packSingle,
  }
}

function voiceMeasure(measure: Measure, voice: DrumVoice): Measure {
  const slots = getMeasureVoices(measure)[voice]
  return {
    ...measure,
    notes: slots.map((slot) => ({slot, voice}) as unknown as MeasureNoteSlot),
  }
}

export function createNotationDriver(
  staff: SingleStaff,
  score: MusicScore | undefined,
  skinPack: SkinPack,
): NotationDriver {
  const type = resolveStaffType(staff, score)
  if (type === MusicScoreTypeEnum.NumberNotation) {
    const skin = withEmptySkinFallback(skinPack.numberNotation ?? defaultSkin.numberNotation!)
    const measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45
    return pitchedDriver(type, {
      skin: asSkin(skin),
      measureKey: NumberNotationSkinKeyEnum.Measure,
      measureHeight,
      measureLineWidth: skin[NumberNotationSkinKeyEnum.Measure]?.w ?? 1,
      own: (measure) => numberOwnRatio(measure, skin),
      adapter: createNumberNotationColumnLayoutAdapter(skin, measureHeight),
      fixed: (measure) => computeNumberNotationMeasureFixedWidths(measure, skin),
      barlineFX: (measure, measureX) => numberBarlineFX(measure, measureX, skin),
      barlineX: (measure, measureX, measureWidth) => numberBarlineX(measure, measureX, measureWidth, skin),
      linkedKey: numberLinkedKey,
      bracketKey: numberBracketKey,
    })
  }
  if (type === MusicScoreTypeEnum.DrumNotation) {
    return bindDrumStaff(staff, skinPack)
  }
  if (isFretboardScoreType(type)) {
    return createTabDriver(type, skinPack)
  }
  const skin = withEmptySkinFallback(skinPack.standardStaff ?? defaultSkin.standardStaff!)
  const measureHeight = skin[StandardStaffSkinKeyEnum.Measure]?.h ?? 45
  return pitchedDriver(type, {
    skin: asSkin(skin),
    measureKey: StandardStaffSkinKeyEnum.Measure,
    measureHeight,
    measureLineWidth: skin[StandardStaffSkinKeyEnum.Measure]?.w ?? 1,
    own: (measure) => standardOwnRatio(measure, skin),
    adapter: createStandardStaffColumnLayoutAdapter(skin, measureHeight),
    fixed: (measure) => computeStandardMeasureFixedWidths(measure, skin),
    barlineFX: (measure, measureX) => standardBarlineFX(measure, measureX, skin),
    barlineX: (measure, measureX, measureWidth) => standardBarlineX(measure, measureX, measureWidth, skin),
    linkedKey: standardLinkedKey,
    bracketKey: standardBracketKey,
  })
}

function createTabDriver(type: MusicScoreTypeEnum, skinPack: SkinPack): NotationDriver {
  const strings = fretboardStringCount(type)
  if (strings === 4) {
    const skin = withEmptySkinFallback(skinPack.tab4 ?? defaultSkin.tab4!) as unknown as Tab6SkinPack
    return tabDriver(type, skin, {
      own: tab4OwnRatio,
      fixed: tab4Fixed,
      adapter: tab4Adapter,
      barlineFX: tab4BarlineFX,
      barlineX: tab4BarlineX,
      linkedKey: tab4LinkedKey,
      bracketKey: tab4BracketKey,
    })
  }
  if (strings === 5) {
    const skin = withEmptySkinFallback(skinPack.tab5 ?? defaultSkin.tab5!) as unknown as Tab6SkinPack
    return tabDriver(type, skin, {
      own: tab5OwnRatio,
      fixed: tab5Fixed,
      adapter: tab5Adapter,
      barlineFX: tab5BarlineFX,
      barlineX: tab5BarlineX,
      linkedKey: tab5LinkedKey,
      bracketKey: tab5BracketKey,
    })
  }
  const skin = withEmptySkinFallback(skinPack.tab6 ?? defaultSkin.tab6!)
  return tabDriver(type, skin, {
    own: tab6OwnRatio,
    fixed: tab6Fixed,
    adapter: tab6Adapter,
    barlineFX: tab6BarlineFX,
    barlineX: tab6BarlineX,
    linkedKey: tab6LinkedKey,
    bracketKey: tab6BracketKey,
  })
}

function tabDriver(
  type: MusicScoreTypeEnum,
  skin: Tab6SkinPack,
  api: {
    own: (measure: Measure, skin: Tab6SkinPack) => number
    fixed: (measure: Measure, skin: Tab6SkinPack) => { prefixW: number; suffixW: number }
    adapter: (skin: Tab6SkinPack, measureHeight: number) => ColumnLayoutSource['adapter']
    barlineFX: (measure: Measure, measureX: number, skin: Tab6SkinPack) => number
    barlineX: (measure: Measure, measureX: number, measureWidth: number, skin: Tab6SkinPack) => number
    linkedKey: NotationDriver['linkedBarlineKey']
    bracketKey: NotationDriver['bracketKey']
  },
): NotationDriver {
  const measureHeight = skin[Tab6SkinKeyEnum.Measure]?.h ?? 45
  return pitchedDriver(type, {
    skin: asSkin(skin),
    measureKey: Tab6SkinKeyEnum.Measure,
    measureHeight,
    measureLineWidth: skin[Tab6SkinKeyEnum.Measure]?.w ?? 1,
    own: (measure) => api.own(measure, skin),
    adapter: api.adapter(skin, measureHeight),
    fixed: (measure) => api.fixed(measure, skin),
    barlineFX: (measure, measureX) => api.barlineFX(measure, measureX, skin),
    barlineX: (measure, measureX, measureWidth) => api.barlineX(measure, measureX, measureWidth, skin),
    linkedKey: api.linkedKey,
    bracketKey: api.bracketKey,
  })
}

/** 鼓谱的宽度和声部拆分依赖整条单谱表的长休止符分组 */
function bindDrumStaff(staff: SingleStaff, skinPack: SkinPack): NotationDriver {
  const skin = withEmptySkinFallback(skinPack.drumNotation ?? defaultSkin.drumNotation!)
  const measureHeight = skin[DrumNotationSkinKeyEnum.Measure]?.h ?? 45
  const adapter = createDrumColumnLayoutAdapter(skin)
  const roles = computeLongRestRoles(staff.measures)
  const roleAt = (index: number) => roles[index] ?? null
  return {
    type: MusicScoreTypeEnum.DrumNotation,
    skin: asSkin(skin),
    measureHeight,
    measureLineWidth: skin[DrumNotationSkinKeyEnum.Measure]?.w ?? 1,
    measureSkinKey: DrumNotationSkinKeyEnum.Measure,
    ownWidthRatio: (measure, index) => drumOwnRatio(measure, skin, roleAt(index)),
    unlinkedWidthRatio: (measure, index) => drumMeasureWidthRatio([measure], [roleAt(index)], skin),
    participants: (measure, index) => {
      if (roleAt(index)) return []
      return (['up', 'down'] as const).map((voice) => ({
        measure: voiceMeasure(measure, voice),
        adapter,
      }))
    },
    fixedWidths: (measure, index) => computeDrumMeasureFixedWidths(measure, skin, roleAt(index)),
    showsBarline: (measure, index, side) => {
      const role = roleAt(index)
      if (side === 'f') return !!measure.barline_f && longRestShowsPrefix(role)
      return !!measure.barline_b && longRestShowsSuffix(role)
    },
    barlineFX: (measure, measureX, index) => drumBarlineFX(measure, measureX, skin, roleAt(index)),
    barlineX: (measure, measureX, measureWidth, index) =>
      drumBarlineX(measure, measureX, measureWidth, skin, roleAt(index)),
    linkedBarlineKey: drumLinkedKey,
    bracketKey: drumBracketKey,
    packLayouts: (layouts) => {
      const up = layouts[0]
      const down = layouts[1]
      return up && down ? {up, down} satisfies DrumMeasureColumnLayout : null
    },
    longRestAt: roleAt,
  }
}

/** 把单谱表、小节、槽位、音符 id 都指到这份谱种皮肤，附属符号按锚点取 */
export function indexStaffAnchors(
  map: Map<string, StaffAnchor>,
  staff: SingleStaff,
  driver: NotationDriver,
): void {
  const anchor: StaffAnchor = {
    type: driver.type,
    skin: driver.skin,
    measureHeight: driver.measureHeight,
  }
  map.set(staff.id, anchor)
  for (const measure of staff.measures) {
    map.set(measure.id, anchor)
    for (const slot of getMeasureSlots(measure)) {
      map.set(slot.id, anchor)
      const sym = slot.symbol as {
        id?: string
        notesInfo?: {id: string}[]
        graceNotes?: {id: string}[]
        graceNotesAfter?: {id: string}[]
      }
      if (sym?.id) map.set(sym.id, anchor)
      for (const note of [...(sym?.notesInfo ?? []), ...(sym?.graceNotes ?? []), ...(sym?.graceNotesAfter ?? [])]) {
        if (note?.id) map.set(note.id, anchor)
      }
    }
  }
}

export function buildStaffAnchors(score: MusicScore, skinPack: SkinPack): Map<string, StaffAnchor> {
  const map = new Map<string, StaffAnchor>()
  for (const grandStaff of score.grandStaffs ?? []) {
    for (const staff of grandStaff.staves ?? []) {
      indexStaffAnchors(map, staff, createNotationDriver(staff, score, skinPack))
    }
  }
  return map
}
