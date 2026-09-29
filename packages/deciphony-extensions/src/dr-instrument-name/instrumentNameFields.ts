import type {SingleStaff} from '@deciphony/renderer'

type InstrumentNameData = {instrumentName?: unknown}

/** 读取单谱表自定义乐器名（singleStaff.data.instrumentName）；未设置或为空返回 undefined */
export function readInstrumentName(staff: SingleStaff | null | undefined): string | undefined {
  const value = (staff?.data as InstrumentNameData | undefined)?.instrumentName
  if (typeof value !== 'string') return undefined
  return value.trim() ? value : undefined
}

/** 写入单谱表乐器名；传空字符串 / undefined 时删除字段，回落到默认乐器 */
export function writeInstrumentName(staff: SingleStaff, name: string | undefined): void {
  const data = (staff.data ?? {}) as InstrumentNameData
  if (name == null || !name.trim()) {
    delete data.instrumentName
  } else {
    data.instrumentName = name
  }
  staff.data = data
}

/** 实际展示的乐器名：单谱表自定义优先，否则默认乐器 */
export function resolveInstrumentName(
  staff: SingleStaff | null | undefined,
  defaultInstrument = '',
): string {
  return readInstrumentName(staff) ?? defaultInstrument
}
