import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import type {VDom} from '@/types/common'
import type {Measure, MeasureNoteSlot} from '@/types/MusicScoreType'
import type {NodeIdMap} from '@/standardStaff/render/types'
import {applyRelativeFramesToVDomRange, type RelativeFrame} from '@/render/vdomFrame'
import {renderMeasureRepeat} from '@/render/repeat/renderMeasureRepeat'
import {renderSingleMeasureAffiliatedSymbols} from '@/render/affiliated'
import type {NotationDriver} from './types'

import {renderSymbol as renderStandard} from '@/standardStaff/render/symbol/renderSymbol'
import {processBeam as beamStandard} from '@/standardStaff/render/beam/processBeam'
import {processGraceBeam as graceStandard} from '@/standardStaff/render/beam/processGraceBeam'
import type {NumberNotationSkinPack, StandardStaffSkinPack, Tab6SkinPack, DrumNotationSkinPack} from '@/types/common'

import {renderSymbol as renderNumber} from '@/numberNotation/render/symbol/renderSymbol'
import {processBeam as beamNumber} from '@/numberNotation/render/beam/processBeam'
import {renderSymbol as renderTab6} from '@/tab6/render/symbol/renderSymbol'
import {processBeam as beamTab6} from '@/tab6/render/beam/processBeam'
import {renderSymbol as renderTab4} from '@/tab4/render/symbol/renderSymbol'
import {processBeam as beamTab4} from '@/tab4/render/beam/processBeam'
import {renderSymbol as renderTab5} from '@/tab5/render/symbol/renderSymbol'
import {processBeam as beamTab5} from '@/tab5/render/beam/processBeam'
import {renderSymbol as renderDrum} from '@/drumNotation/render/symbol/renderSymbol'
import {processBeam as beamDrum} from '@/drumNotation/render/beam/processBeam'
import {processGraceBeam as graceDrum} from '@/drumNotation/render/beam/processGraceBeam'
import {getMeasureVoices} from '@/utils/measureNotes'
import {DrumNotationSkinKeyEnum} from '@/drumNotation/enums/drumNotationSkinKeyEnum'
import {
  LONG_REST_NUMBER_DIGIT_WIDTH_RATIO,
  LONG_REST_NUMBER_GAP_RATIO,
  LONG_REST_NUMBER_HEIGHT_RATIO,
} from '@/drumNotation/render/constants'
import type {DrumMeasureColumnLayout, LongRestRole} from '@/drumNotation/render/types'

export type StaffPaintContext = {
  measures: Measure[]
  getMeasureW: (measure: Measure, index: number) => number
  measureX0: number
  measureY: number
  measureTopY: number
  /** 连谱时为这一列的共享列布局；非连谱为 null，由各谱种自己排 */
  columnLayoutAt: (index: number) => unknown
  vDoms: VDom[]
  nodeIdMap: NodeIdMap
  skinName: string
  relativeFrameMap: ReadonlyMap<string, RelativeFrame>
  relativeApplied: WeakSet<VDom>
}

function stamp(nodes: VDom[], from: number, type: MusicScoreTypeEnum): void {
  for (let i = from; i < nodes.length; i++) nodes[i]!.notationType ??= type
}

type PaintHooks = {
  renderSymbol: (measure: Measure, index: number, x: number, width: number) => VDom[]
  processBeams: (measure: Measure, index: number, start: number, symbolLength: number) => void
  finish?: () => void
}

function paintLoop(driver: NotationDriver, ctx: StaffPaintContext, hooks: PaintHooks): void {
  const {vDoms} = ctx
  let x = ctx.measureX0
  for (let index = 0; index < ctx.measures.length; index++) {
    const measure = ctx.measures[index]!
    const width = ctx.getMeasureW(measure, index)
    const start = vDoms.length
    const symbols = hooks.renderSymbol(measure, index, x, width)
    for (const node of symbols) node.notationType = driver.type
    vDoms.push(...symbols)
    vDoms.push(...renderMeasureRepeat({
      measure,
      measureX: x,
      measureY: ctx.measureY,
      measureWidth: width,
      measureHeight: driver.measureHeight,
      skin: driver.skin as StandardStaffSkinPack,
      skinName: ctx.skinName,
      idMap: ctx.nodeIdMap,
    }))
    renderSingleMeasureAffiliatedSymbols(
      measure,
      x,
      ctx.measureY,
      width,
      driver.measureHeight,
      {
        VDoms: vDoms,
        idMap: ctx.nodeIdMap,
        skinName: ctx.skinName,
        skin: driver.skin,
        measureHeight: driver.measureHeight,
        notationType: driver.type,
      },
    )
    applyRelativeFramesToVDomRange(vDoms, ctx.relativeFrameMap, start, vDoms.length, ctx.relativeApplied)
    hooks.processBeams(measure, index, start, symbols.length)
    stamp(vDoms, start, driver.type)
    x += width
  }
  hooks.finish?.()
}

function pitchedColumn(layout: unknown) {
  return (layout ?? null) as import('@/render/layout/measureColumnLayout').MeasureColumnLayout | null
}

/** 单谱表上的音符、符杠、反复、单小节附属。小节框和插槽由共用排版画 */
export function paintStaffNotes(driver: NotationDriver, ctx: StaffPaintContext): void {
  const type = driver.type
  if (type === MusicScoreTypeEnum.NumberNotation) {
    const skin = driver.skin as unknown as NumberNotationSkinPack
    paintLoop(driver, ctx, {
      renderSymbol: (measure, index, x, width) => renderNumber({
        measure,
        measures: ctx.measures,
        measureIndex: index,
        measureX: x,
        measureY: ctx.measureY,
        measureWidth: width,
        measureHeight: driver.measureHeight,
        measureLineWidth: driver.measureLineWidth,
        skin,
        idMap: ctx.nodeIdMap,
        skinName: ctx.skinName,
        columnLayout: pitchedColumn(ctx.columnLayoutAt(index)),
      }),
      processBeams: (measure, _index, _start, symbolLength) => {
        beamNumber({
          measure: measure as {notes: MeasureNoteSlot[]},
          nodeIdMap: ctx.nodeIdMap,
          vDoms: ctx.vDoms,
          symbolVDomsLength: symbolLength,
          skin,
          measureHeight: driver.measureHeight,
          measureLineWidth: driver.measureLineWidth,
        })
      },
    })
    return
  }
  if (type === MusicScoreTypeEnum.DrumNotation) {
    paintDrum(driver, ctx)
    return
  }
  if (type === MusicScoreTypeEnum.Ukulele || type === MusicScoreTypeEnum.Bass4) {
    paintTab(driver, ctx, renderTab4, beamTab4)
    return
  }
  if (type === MusicScoreTypeEnum.Bass5) {
    paintTab(driver, ctx, renderTab5, beamTab5)
    return
  }
  if (type === MusicScoreTypeEnum.Guitar || type === MusicScoreTypeEnum.Bass6) {
    paintTab(driver, ctx, renderTab6, beamTab6)
    return
  }
  const skin = driver.skin as unknown as StandardStaffSkinPack
  paintLoop(driver, ctx, {
    renderSymbol: (measure, index, x, width) => renderStandard({
      measure,
      measures: ctx.measures,
      measureIndex: index,
      measureX: x,
      measureY: ctx.measureY,
      measureWidth: width,
      measureHeight: driver.measureHeight,
      measureLineWidth: driver.measureLineWidth,
      skin,
      idMap: ctx.nodeIdMap,
      skinName: ctx.skinName,
      columnLayout: pitchedColumn(ctx.columnLayoutAt(index)),
    }),
    processBeams: (measure, _index, start, symbolLength) => {
      const beam = {
        measure: measure as {notes: MeasureNoteSlot[]},
        nodeIdMap: ctx.nodeIdMap,
        vDoms: ctx.vDoms,
        symbolVDomsStartIdx: start,
        symbolVDomsLength: symbolLength,
        skin,
        measureHeight: driver.measureHeight,
        measureLineWidth: driver.measureLineWidth,
        skinName: ctx.skinName,
      }
      beamStandard(beam)
      graceStandard(beam)
    },
  })
}

function paintTab(
  driver: NotationDriver,
  ctx: StaffPaintContext,
  renderSymbol: typeof renderTab6,
  processBeam: typeof beamTab6,
): void {
  const skin = driver.skin as unknown as Tab6SkinPack
  paintLoop(driver, ctx, {
    renderSymbol: (measure, index, x, width) => renderSymbol({
      measure,
      measures: ctx.measures,
      measureIndex: index,
      measureX: x,
      measureY: ctx.measureY,
      measureWidth: width,
      measureHeight: driver.measureHeight,
      measureLineWidth: driver.measureLineWidth,
      skin,
      idMap: ctx.nodeIdMap,
      skinName: ctx.skinName,
      columnLayout: pitchedColumn(ctx.columnLayoutAt(index)),
    }),
    processBeams: (measure, _index, start, symbolLength) => {
      processBeam({
        measure: measure as {notes: MeasureNoteSlot[]},
        nodeIdMap: ctx.nodeIdMap,
        vDoms: ctx.vDoms,
        symbolVDomsStartIdx: start,
        symbolVDomsLength: symbolLength,
        skin,
        measureHeight: driver.measureHeight,
        measureLineWidth: driver.measureLineWidth,
        skinName: ctx.skinName,
      })
    },
  })
}

function paintDrum(driver: NotationDriver, ctx: StaffPaintContext): void {
  const skin = driver.skin as unknown as DrumNotationSkinPack
  const spans = new Map<number, {startX: number; endX: number; role: LongRestRole}>()
  paintLoop(driver, ctx, {
    renderSymbol: (measure, index, x, width) => {
      const longRest = driver.longRestAt?.(index) ?? null
      const symbols = renderDrum({
        measure,
        measures: ctx.measures,
        measureIndex: index,
        measureX: x,
        measureY: ctx.measureY,
        measureWidth: width,
        measureHeight: driver.measureHeight,
        measureLineWidth: driver.measureLineWidth,
        skin,
        idMap: ctx.nodeIdMap,
        skinName: ctx.skinName,
        columnLayout: (ctx.columnLayoutAt(index) ?? null) as DrumMeasureColumnLayout | null,
        longRest,
      })
      if (longRest) {
        const rest = symbols.find((node) => node.tag === 'longRest')
        if (rest) {
          const span = spans.get(longRest.startIndex)
          if (span) span.endX = rest.x + rest.w
          else spans.set(longRest.startIndex, {startX: rest.x, endX: rest.x + rest.w, role: longRest})
        }
      }
      return symbols
    },
    processBeams: (measure, index, start, symbolLength) => {
      if (driver.longRestAt?.(index)) return
      const voices = getMeasureVoices(measure)
      let length = symbolLength
      for (const direction of ['up', 'down'] as const) {
        const beam = {
          slots: voices[direction],
          direction,
          nodeIdMap: ctx.nodeIdMap,
          vDoms: ctx.vDoms,
          symbolVDomsStartIdx: start,
          skin,
          measureHeight: driver.measureHeight,
          measureLineWidth: driver.measureLineWidth,
          skinName: ctx.skinName,
        }
        length -= beamDrum({...beam, symbolVDomsLength: length})
        length -= graceDrum({...beam, symbolVDomsLength: length})
      }
    },
    finish: () => {
      const numberH = LONG_REST_NUMBER_HEIGHT_RATIO * driver.measureHeight
      for (const [startIndex, span] of spans) {
        const count = span.role.endIndex - span.role.startIndex + 1
        const numberW = String(count).length * LONG_REST_NUMBER_DIGIT_WIDTH_RATIO * numberH
        const node: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {longRestNumber: {count}},
          x: (span.startX + span.endX) / 2 - numberW / 2,
          y: ctx.measureTopY - LONG_REST_NUMBER_GAP_RATIO * driver.measureHeight - numberH,
          w: numberW,
          h: numberH,
          zIndex: 1200,
          tag: 'longRestNumber',
          skinKey: DrumNotationSkinKeyEnum.LongRestNumber,
          skinName: ctx.skinName,
          targetId: ctx.measures[startIndex]!.id,
          notationType: driver.type,
          dataComment: '长休止符小节数',
        }
        ctx.vDoms.push(node)
      }
    },
  })
}
