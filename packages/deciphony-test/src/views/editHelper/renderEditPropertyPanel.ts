import type {SlotData} from '@deciphony/renderer'
import {isNumberHeadSelected} from './numberNotation/renderEditNumberHeadDrag'
import {isNoteHeadSelected} from './standardStaff/renderEditNoteHeadDrag'
import {isSlurSelected} from './renderEditSlurDrag'
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
  if (isMeasureAddMode(selected)) return 'measure'
  if (isNoteHeadSelected(selected)) return 'noteHead'
  if (isNumberHeadSelected(selected)) return 'numberHead'
  if (isVoltaSelected(selected)) return 'volta'
  if (isSlurSelected(selected)) return null
  return null
}
