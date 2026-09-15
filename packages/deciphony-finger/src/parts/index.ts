import {FINGER_PART_DEFS, type FingerPartDef, type FingerPartId} from './meta'
import {svgToDataUrl} from './toDataUrl'
import thumb1 from './thumb-1.svg?raw'
import thumb2 from './thumb-2.svg?raw'
import index1 from './index-1.svg?raw'
import index2 from './index-2.svg?raw'
import index3 from './index-3.svg?raw'
import middle1 from './middle-1.svg?raw'
import middle2 from './middle-2.svg?raw'
import middle3 from './middle-3.svg?raw'
import ring1 from './ring-1.svg?raw'
import ring2 from './ring-2.svg?raw'
import ring3 from './ring-3.svg?raw'
import little1 from './little-1.svg?raw'
import little2 from './little-2.svg?raw'
import little3 from './little-3.svg?raw'

const RAW: Record<FingerPartId, string> = {
  'thumb-1': thumb1,
  'thumb-2': thumb2,
  'index-1': index1,
  'index-2': index2,
  'index-3': index3,
  'middle-1': middle1,
  'middle-2': middle2,
  'middle-3': middle3,
  'ring-1': ring1,
  'ring-2': ring2,
  'ring-3': ring3,
  'little-1': little1,
  'little-2': little2,
  'little-3': little3,
}

export interface FingerPart extends FingerPartDef {
  href: string
}

export const fingerParts: Record<FingerPartId, FingerPart> = Object.fromEntries(
  FINGER_PART_DEFS.map((def) => [def.id, {...def, href: svgToDataUrl(RAW[def.id])}])
) as Record<FingerPartId, FingerPart>

export const FINGER_PART_LIST: FingerPart[] = FINGER_PART_DEFS.map((def) => fingerParts[def.id])

export type {FingerPartDef, FingerPartId} from './meta'
export {FINGER_PART_DEFS} from './meta'
