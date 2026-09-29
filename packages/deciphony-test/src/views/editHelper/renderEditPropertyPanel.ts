import type {MeasureNoteSymbol, SlotData} from '@deciphony/renderer'
import {MusicScoreTypeEnum} from '@deciphony/renderer'
import {isDrumNotesInfo, isDrumRestBody} from '@deciphony/extensions/dr-edit'
import {isNumberHeadSelected} from './numberNotation/renderEditNumberHeadDrag'
import {isNoteHeadSelected} from './standardStaff/renderEditNoteHeadDrag'
import {isSlurSelected} from './renderEditSlurDrag'
import {isArpeggioSelected} from './renderEditArpeggioDrag'
import {isStrummingSelected} from './renderEditStrummingDrag'
import {isPedalSelected} from './renderEditPedalDrag'
import {isPitchSelected} from './renderEditPitchDrag'
import {isVoltaSelected} from './renderEditVoltaDrag'
import {isMeasureAddMode} from './standardStaff/renderEditSymbolAddAction'
import {isBendSelected, isTabInfoSelected, isTabScore} from './tab/renderEditTabSelection'

/** 右侧属性栏种类；null 表示关闭 */
export type PropertyPanelKind =
  | 'measure'
  | 'noteHead'
  | 'numberHead'
  | 'volta'
  | 'tabMeasure'
  | 'tabNote'
  | 'slur'
  | 'bend'
  | 'drumNote'
  | 'drumRest'
  | null

/**
 * 根据当前选中项决定展示哪一类属性栏。
 * 默认关闭；仅命中已知编辑模式时展开对应面板。
 */
export function resolvePropertyPanelKind(selected: SlotData | null): PropertyPanelKind {
  if (selected && isTabScore(selected.musicScore)) {
    if (isBendSelected(selected)) return 'bend'
    if (isSlurSelected(selected)) return 'slur'
    if (isTabInfoSelected(selected)) return 'tabNote'
    if (isMeasureAddMode(selected)) return 'tabMeasure'
  }
  if (selected?.musicScore.type === MusicScoreTypeEnum.DrumNotation) {
    if (isMeasureAddMode(selected)) return 'measure'
    if (selected.measure && isDrumNotesInfo(selected.info) && selected.self === selected.info) return 'drumNote'
    if (selected.measure && isDrumRestBody(selected.self as unknown as MeasureNoteSymbol)) return 'drumRest'
    if (isVoltaSelected(selected)) return 'volta'
    return null
  }
  if (isMeasureAddMode(selected)) return 'measure'
  if (isNoteHeadSelected(selected)) return 'noteHead'
  if (isNumberHeadSelected(selected)) return 'numberHead'
  if (isVoltaSelected(selected)) return 'volta'
  if (isSlurSelected(selected)) return null
  if (isArpeggioSelected(selected)) return null
  if (isStrummingSelected(selected)) return null
  if (isPedalSelected(selected)) return null
  if (isPitchSelected(selected)) return null
  return null
}
