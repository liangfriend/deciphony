/**
 * 曲谱排版：复谱表、单谱表、小节框和连谱列对齐只此一份。
 * 谱种在单谱表上。音符、符杠仍按谱种画（paintStaffNotes）。
 * 连谱时不同谱种按 chronaxie onset 共用列；鼓谱上下声部各算一条时间线。
 *
 * Frame 分三段施加，原因与原先各谱种实现相同：
 * 符杠要读已经偏移过的符干；连音线要读已经偏移过的符头；连谱号和小节框比符杠晚生成。
 */

import type {Skin, SkinPack, SlotConfig, SlotName, VDom} from '@/types/common'
import type {Measure, MusicScore} from '@/types/MusicScoreType'
import {defaultSkin} from '@/skins/defaultSkin'
import type {NodeIdMap} from '@/standardStaff/render/types'
import {
  DEFAULT_CELL_BASE_WIDTH_RATIO,
  buildHeterogeneousLinkedLayouts,
  countHeterogeneousOnsetColumns,
  type ColumnLayoutSource,
} from '@/render/layout/measureColumnLayout'
import {applyRelativeFramesToVDomRange, collectRelativeFrameMap} from '@/render/vdomFrame'
import {renderMusicScoreAffiliatedSymbols} from '@/render/affiliated'
import {
  slotDataForGrandStaff,
  slotDataForMeasure,
  slotDataForMusicScore,
  slotDataForSingleStaff,
} from '@/render/slotData'
import {createNotationDriver, indexStaffAnchors} from '@/render/notation/createNotationDriver'
import {paintStaffNotes} from '@/render/notation/paintStaffNotes'
import type {NotationDriver, StaffAnchor} from '@/render/notation/types'
import {primaryStaffType} from '@/render/staffType'

function slotH(config: SlotConfig, name: SlotName): number {
  return config[name]?.h ?? 0
}

function slotW(config: SlotConfig, name: SlotName): number {
  return config[name]?.w ?? 0
}

function slotZ(config: SlotConfig, name: SlotName): number {
  const z = config[name]?.zIndex
  if (z !== undefined) return z
  return name === 'm' ? 1100 : 1000
}

function box(partial: Partial<VDom> & Pick<VDom, 'x' | 'y' | 'w' | 'h' | 'zIndex' | 'tag' | 'skinName'>): VDom {
  return {
    startPoint: {x: 0, y: 0},
    endPoint: {x: 0, y: 0},
    special: {},
    targetId: '',
    ...partial,
  }
}

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
  let obj = map.get(id)
  if (!obj) {
    obj = {}
    map.set(id, obj)
  }
  obj[vdom.tag] = vdom
}

export function musicScoreToVDom(
  musicScore: MusicScore,
  slotConfig?: SlotConfig,
  options?: {skin?: Skin; skinName?: string},
): VDom[] {
  const nodeIdMap: NodeIdMap = new Map()
  const {width, grandStaffs} = musicScore
  const config: SlotConfig = slotConfig ?? {}
  const skins = options?.skin
  const skinName = options?.skinName
  const effectiveSkinName = skinName && skins && skinName in skins ? skinName : 'default'
  const skinPack: SkinPack = skins?.[effectiveSkinName] ?? defaultSkin
  const vDoms: VDom[] = []
  const relativeFrameMap = collectRelativeFrameMap(musicScore)
  const relativeApplied = new WeakSet<VDom>()
  const anchors = new Map<string, StaffAnchor>()

  const gLW = slotW(config, 'g-l')
  const gRW = slotW(config, 'g-r')
  const sLW = slotW(config, 's-l')
  const sRW = slotW(config, 's-r')
  const grandStaffX = gLW + sLW
  const grandStaffW = width - gLW - gRW - sLW - sRW
  const gUH = slotH(config, 'g-u')
  const gDH = slotH(config, 'g-d')
  const sUH = slotH(config, 's-u')
  const sDH = slotH(config, 's-d')
  const mUH = slotH(config, 'm-u')
  const mDH = slotH(config, 'm-d')
  const tH = slotH(config, 't')

  let scoreCurrentY = 0

  if (musicScore.topSpaceHeight > 0) {
    vDoms.push(box({
      x: 0,
      y: scoreCurrentY,
      w: musicScore.width,
      h: musicScore.topSpaceHeight,
      zIndex: 1000,
      tag: 'space',
      skinName: effectiveSkinName,
      dataComment: '顶部留白',
    }))
    scoreCurrentY += musicScore.topSpaceHeight
  }

  if (tH > 0) {
    vDoms.push(box({
      x: 0,
      y: scoreCurrentY,
      w: musicScore.width,
      h: tH,
      zIndex: slotZ(config, 't'),
      tag: 'slot',
      skinName: effectiveSkinName,
      targetId: 't',
      slotData: slotDataForMusicScore(musicScore),
      slotName: 't',
      dataComment: '顶部插槽',
    }))
    scoreCurrentY += tH
  }

  for (const grandStaff of grandStaffs) {
    const grandStaffStartY = scoreCurrentY
    const drivers = grandStaff.staves.map((staff) => createNotationDriver(staff, musicScore, skinPack))
    const linkedStaff = grandStaff.linkedStaff ?? false
    const linked = linkedStaff
      ? layoutLinkedColumns(grandStaff.staves, drivers, grandStaffW)
      : null

    const glSlot = box({
      x: 0,
      y: grandStaffStartY,
      w: gLW,
      h: 0,
      zIndex: slotZ(config, 'g-l'),
      tag: 'slot',
      skinName: effectiveSkinName,
      slotName: 'g-l',
      targetId: `g-l-${grandStaff.id}`,
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表左侧插槽',
    })
    vDoms.push(glSlot)
    const grSlot = box({
      x: width - gRW,
      y: grandStaffStartY,
      w: gRW,
      h: 0,
      zIndex: slotZ(config, 'g-r'),
      tag: 'slot',
      skinName: effectiveSkinName,
      slotName: 'g-r',
      targetId: `g-r-${grandStaff.id}`,
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表右侧插槽',
    })
    vDoms.push(grSlot)

    let grandStaffCurrentY = grandStaffStartY
    const gSlot = box({
      x: grandStaffX,
      y: grandStaffStartY,
      w: grandStaffW,
      h: 0,
      zIndex: slotZ(config, 'g'),
      tag: 'slot',
      skinName: effectiveSkinName,
      slotName: 'g',
      targetId: `g-${grandStaff.id}`,
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表（含外边距）',
    })
    vDoms.push(gSlot)

    vDoms.push(box({
      x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.uSpace,
      zIndex: 1000, tag: 'space', skinName: effectiveSkinName, dataComment: '复谱表上边距',
    }))
    grandStaffCurrentY += grandStaff.uSpace
    vDoms.push(box({
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: gUH,
      zIndex: slotZ(config, 'g-u'),
      tag: 'slot',
      skinName: effectiveSkinName,
      slotName: 'g-u',
      targetId: `g-u-${grandStaff.id}`,
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表上方插槽',
    }))
    grandStaffCurrentY += gUH

    let prevMeasureBottomY: number | undefined
    const staffMeasureBounds: {measureTopY: number; measureBottomY: number}[] = []

    for (let i = 0; i < grandStaff.staves.length; i++) {
      const staff = grandStaff.staves[i]!
      const driver = drivers[i]!
      indexStaffAnchors(anchors, staff, driver)
      const singleStaffStartY = grandStaffCurrentY

      let totalWidthRatio = 0
      if (!linked) {
        staff.measures.forEach((measure, mi) => {
          totalWidthRatio += driver.unlinkedWidthRatio(measure, mi)
        })
        if (!Number.isFinite(totalWidthRatio) || totalWidthRatio <= 0) totalWidthRatio = 1
      }
      const getMeasureW = (measure: Measure, mi: number) =>
        linked ? (linked.widths[mi] ?? 0) : driver.unlinkedWidthRatio(measure, mi) / totalWidthRatio * grandStaffW

      const sSlot = box({
        x: grandStaffX,
        y: singleStaffStartY,
        w: grandStaffW,
        h: 0,
        zIndex: slotZ(config, 's'),
        tag: 'slot',
        skinName: effectiveSkinName,
        slotName: 's',
        targetId: `s-${staff.id}`,
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
        dataComment: '单谱表（含外边距）',
      })
      vDoms.push(sSlot)
      const slSlot = box({
        x: gLW,
        y: singleStaffStartY,
        w: sLW,
        h: 0,
        zIndex: slotZ(config, 's-l'),
        tag: 'slot',
        skinName: effectiveSkinName,
        slotName: 's-l',
        targetId: `s-l-${staff.id}`,
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
        dataComment: '单谱表左侧插槽',
      })
      vDoms.push(slSlot)
      const srSlot = box({
        x: width - gLW - gRW,
        y: singleStaffStartY,
        w: sRW,
        h: 0,
        zIndex: slotZ(config, 's-r'),
        tag: 'slot',
        skinName: effectiveSkinName,
        slotName: 's-r',
        targetId: `s-r-${staff.id}`,
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
        dataComment: '单谱表右侧插槽',
      })
      vDoms.push(srSlot)

      vDoms.push(box({
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staff.uSpaceO,
        zIndex: 1000, tag: 'space', skinName: effectiveSkinName, dataComment: '单谱表上外边距',
      }))
      grandStaffCurrentY += staff.uSpaceO
      vDoms.push(box({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: sUH,
        zIndex: slotZ(config, 's-u'),
        tag: 'slot',
        skinName: effectiveSkinName,
        slotName: 's-u',
        targetId: `s-u-${staff.id}`,
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
        dataComment: '单谱表上方插槽',
      }))
      grandStaffCurrentY += sUH

      let measureX = grandStaffX
      for (let mi = 0; mi < staff.measures.length; mi++) {
        const measure = staff.measures[mi]!
        const measureWidth = getMeasureW(measure, mi)
        vDoms.push(box({
          x: measureX,
          y: grandStaffCurrentY,
          w: measureWidth,
          h: mUH,
          zIndex: slotZ(config, 'm-u'),
          tag: 'slot',
          skinName: effectiveSkinName,
          slotName: 'm-u',
          targetId: `m-u-${measure.id}`,
          slotData: slotDataForMeasure(musicScore, grandStaff, staff, measure),
          dataComment: '小节上方插槽',
        }))
        measureX += measureWidth
      }

      const currentMeasureStartY = grandStaffCurrentY + staff.uSpaceI
      if (linked && i >= 1 && prevMeasureBottomY !== undefined) {
        const linkedBarlineY = prevMeasureBottomY
        const linkedBarlineH = currentMeasureStartY - linkedBarlineY
        let barlineX = grandStaffX
        for (let mi = 0; mi < staff.measures.length; mi++) {
          const measure = staff.measures[mi]!
          const measureWidth = getMeasureW(measure, mi)
          if (driver.showsBarline(measure, mi, 'f')) {
            const key = driver.linkedBarlineKey(measure.barline_f!.type)
            vDoms.push(box({
              x: driver.barlineFX(measure, barlineX, mi),
              y: linkedBarlineY,
              w: driver.skin[key]?.w ?? 0,
              h: linkedBarlineH,
              zIndex: 1200,
              tag: 'linked_barline',
              skinKey: key,
              skinName: effectiveSkinName,
              targetId: measure.barline_f!.id,
              notationType: driver.type,
              dataComment: '连谱小节线',
            }))
          }
          if (driver.showsBarline(measure, mi, 'b')) {
            const key = driver.linkedBarlineKey(measure.barline_b!.type)
            vDoms.push(box({
              x: driver.barlineX(measure, barlineX, measureWidth, mi),
              y: linkedBarlineY,
              w: driver.skin[key]?.w ?? 0,
              h: linkedBarlineH,
              zIndex: 1200,
              tag: 'linked_barline',
              skinKey: key,
              skinName: effectiveSkinName,
              targetId: measure.barline_b!.id,
              notationType: driver.type,
              dataComment: '连谱小节线',
            }))
          }
          barlineX += measureWidth
        }
      }

      vDoms.push(box({
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staff.uSpaceI,
        zIndex: 1000, tag: 'space', skinName: effectiveSkinName, dataComment: '单谱表上内边距',
      }))
      grandStaffCurrentY += staff.uSpaceI

      const measureTopY = grandStaffCurrentY
      measureX = grandStaffX
      for (let mi = 0; mi < staff.measures.length; mi++) {
        const measure = staff.measures[mi]!
        const measureWidth = getMeasureW(measure, mi)
        const measureNode = box({
          x: measureX,
          y: grandStaffCurrentY,
          w: measureWidth,
          h: driver.measureHeight,
          zIndex: 1000,
          tag: 'measure',
          skinName: effectiveSkinName,
          targetId: measure.id,
          dataComment: '小节',
          skinKey: driver.measureSkinKey,
          notationType: driver.type,
        })
        vDoms.push(measureNode)
        setNodeIdMap(nodeIdMap, measure.id, measureNode)
        measureX += measureWidth
      }

      paintStaffNotes(driver, {
        measures: staff.measures,
        getMeasureW,
        measureX0: grandStaffX,
        measureY: grandStaffCurrentY,
        measureTopY,
        columnLayoutAt: (mi) => linked ? linked.layouts[i]?.[mi] ?? null : null,
        vDoms,
        nodeIdMap,
        skinName: effectiveSkinName,
        relativeFrameMap,
        relativeApplied,
      })

      measureX = grandStaffX
      for (let mi = 0; mi < staff.measures.length; mi++) {
        const measure = staff.measures[mi]!
        const measureWidth = getMeasureW(measure, mi)
        vDoms.push(box({
          x: measureX,
          y: grandStaffCurrentY,
          w: measureWidth,
          h: driver.measureHeight,
          zIndex: slotZ(config, 'm'),
          tag: 'slot',
          skinName: effectiveSkinName,
          slotName: 'm',
          targetId: `m-${measure.id}`,
          slotData: slotDataForMeasure(musicScore, grandStaff, staff, measure),
          dataComment: '小节插槽',
        }))
        measureX += measureWidth
      }

      grandStaffCurrentY += driver.measureHeight
      const measureBottomY = measureTopY + driver.measureHeight
      vDoms.push(box({
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staff.dSpaceI,
        zIndex: 1000, tag: 'space', skinName: effectiveSkinName, dataComment: '单谱表下内边距',
      }))
      grandStaffCurrentY += staff.dSpaceI

      measureX = grandStaffX
      for (let mi = 0; mi < staff.measures.length; mi++) {
        const measure = staff.measures[mi]!
        const measureWidth = getMeasureW(measure, mi)
        vDoms.push(box({
          x: measureX,
          y: grandStaffCurrentY,
          w: measureWidth,
          h: mDH,
          zIndex: slotZ(config, 'm-d'),
          tag: 'slot',
          skinName: effectiveSkinName,
          slotName: 'm-d',
          targetId: `m-d-${measure.id}`,
          slotData: slotDataForMeasure(musicScore, grandStaff, staff, measure),
          dataComment: '小节下方插槽',
        }))
        measureX += measureWidth
      }
      grandStaffCurrentY += mDH

      vDoms.push(box({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: sDH,
        zIndex: slotZ(config, 's-d'),
        tag: 'slot',
        skinName: effectiveSkinName,
        slotName: 's-d',
        targetId: `s-d-${staff.id}`,
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
        dataComment: '单谱表下方插槽',
      }))
      grandStaffCurrentY += sDH
      vDoms.push(box({
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staff.dSpaceO,
        zIndex: 1000, tag: 'space', skinName: effectiveSkinName, dataComment: '单谱表下外边距',
      }))
      grandStaffCurrentY += staff.dSpaceO

      const staffH = grandStaffCurrentY - singleStaffStartY
      sSlot.h = staffH
      slSlot.h = staffH
      srSlot.h = staffH
      prevMeasureBottomY = measureBottomY
      staffMeasureBounds.push({measureTopY, measureBottomY})
    }

    const bracket = grandStaff.bracket
    if (bracket) {
      const startIdx = bracket.startSingleStaffIndex
      const endIdx = grandStaff.staves.length - 1
      if (
        startIdx >= 0 &&
        startIdx < staffMeasureBounds.length &&
        endIdx >= startIdx &&
        endIdx - startIdx + 1 >= 2
      ) {
        const bracketDriver = drivers[startIdx]!
        const key = bracketDriver.bracketKey(bracket.type)
        const bracketW = bracketDriver.skin[key]?.w ?? 16
        vDoms.push(box({
          x: grandStaffX - bracketW,
          y: staffMeasureBounds[startIdx]!.measureTopY,
          w: bracketW,
          h: staffMeasureBounds[endIdx]!.measureBottomY - staffMeasureBounds[startIdx]!.measureTopY,
          zIndex: 1200,
          tag: 'bracket',
          skinKey: key,
          skinName: effectiveSkinName,
          targetId: bracket.id,
          notationType: bracketDriver.type,
          dataComment: '连谱号',
        }))
      }
    }

    vDoms.push(box({
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: gDH,
      zIndex: slotZ(config, 'g-d'),
      tag: 'slot',
      skinName: effectiveSkinName,
      slotName: 'g-d',
      targetId: `g-d-${grandStaff.id}`,
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表下方插槽',
    }))
    grandStaffCurrentY += gDH
    vDoms.push(box({
      x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.dSpace,
      zIndex: 1000, tag: 'space', skinName: effectiveSkinName, dataComment: '复谱表下边距',
    }))
    grandStaffCurrentY += grandStaff.dSpace

    const grandStaffH = grandStaffCurrentY - grandStaffStartY
    gSlot.h = grandStaffH
    glSlot.h = grandStaffH
    grSlot.h = grandStaffH
    scoreCurrentY = grandStaffCurrentY
  }

  const eH = config.e?.h
  if (eH !== undefined && eH > 0) {
    vDoms.push(box({
      x: 0,
      y: scoreCurrentY,
      w: width,
      h: eH,
      zIndex: slotZ(config, 'e'),
      tag: 'slot',
      skinName: effectiveSkinName,
      targetId: 'e',
      slotName: 'e',
      slotData: slotDataForMusicScore(musicScore),
      dataComment: '底部插槽',
    }))
  }

  applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, 0, vDoms.length, relativeApplied)
  const scoreAffiliatedStartIdx = vDoms.length
  const fallback = anchors.get(musicScore.grandStaffs[0]?.staves[0]?.id ?? '')
  renderMusicScoreAffiliatedSymbols(musicScore, {
    VDoms: vDoms,
    idMap: nodeIdMap,
    skinName: effectiveSkinName,
    notationType: fallback?.type ?? primaryStaffType(musicScore),
    skin: fallback?.skin,
    measureHeight: fallback?.measureHeight,
    staffAnchors: anchors,
  })
  applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, scoreAffiliatedStartIdx, vDoms.length, relativeApplied)
  vDoms.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  return vDoms
}

function layoutLinkedColumns(
  staves: MusicScore['grandStaffs'][number]['staves'],
  drivers: NotationDriver[],
  grandStaffW: number,
): {widths: number[]; layouts: unknown[][]} {
  const maxMeasures = Math.max(0, ...staves.map((staff) => staff.measures.length))
  const paddingH = Math.max(1, ...drivers.map((driver) => driver.measureHeight))
  const widths: number[] = []
  const layouts: unknown[][] = staves.map(() => [])
  if (maxMeasures === 0) return {widths, layouts}

  const ratios: number[] = []
  const sourcesByMeasure: ColumnLayoutSource[][] = []
  const slicesByMeasure: {si: number; start: number; count: number}[][] = []
  for (let mi = 0; mi < maxMeasures; mi++) {
    const sources: ColumnLayoutSource[] = []
    const slices: {si: number; start: number; count: number}[] = []
    let own = 0
    staves.forEach((staff, si) => {
      const measure = staff.measures[mi]
      if (!measure) return
      own = Math.max(own, drivers[si]!.ownWidthRatio(measure, mi))
      const parts = drivers[si]!.participants(measure, mi)
      slices.push({si, start: sources.length, count: parts.length})
      sources.push(...parts)
    })
    ratios.push(own + DEFAULT_CELL_BASE_WIDTH_RATIO * countHeterogeneousOnsetColumns(sources))
    sourcesByMeasure.push(sources)
    slicesByMeasure.push(slices)
  }
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0) || 1
  for (let mi = 0; mi < maxMeasures; mi++) {
    widths.push((ratios[mi] ?? 0) / ratioSum * grandStaffW)
    let maxPrefixW = 0
    let maxSuffixW = 0
    staves.forEach((staff, si) => {
      const measure = staff.measures[mi]
      if (!measure) return
      const fixed = drivers[si]!.fixedWidths(measure, mi)
      maxPrefixW = Math.max(maxPrefixW, fixed.prefixW)
      maxSuffixW = Math.max(maxSuffixW, fixed.suffixW)
    })
    const built = buildHeterogeneousLinkedLayouts(
      sourcesByMeasure[mi] ?? [],
      Math.max(0, (widths[mi] ?? 0) - maxPrefixW - maxSuffixW),
      maxPrefixW,
      paddingH,
    )
    for (const slice of slicesByMeasure[mi] ?? []) {
      layouts[slice.si]![mi] = slice.count === 0
        ? null
        : drivers[slice.si]!.packLayouts(built.slice(slice.start, slice.start + slice.count))
    }
  }
  return {widths, layouts}
}
