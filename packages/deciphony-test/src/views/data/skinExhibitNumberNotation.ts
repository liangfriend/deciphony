import {KeySignatureTypeEnum} from '@deciphony/renderer'
import standardData from './skinExhibitStandardStaff'
import {convertStandardStaffToNumberNotation} from './scoreBuilder'

/** 五线谱 skinExhibit 中「全部拍号」所在的单谱表下标 */
const TIME_SIGNATURE_STAFF_INDEX = 3

/** 简谱版：与五线谱 skinExhibit 同结构，按 C 调首调换算唱名 */
const data = convertStandardStaffToNumberNotation(standardData, KeySignatureTypeEnum.C)

// 换算会去掉小节拍号；拍号展示行恢复，用于检查简谱拍号皮肤
data.grandStaffs.forEach((grandStaff, gi) => {
  const source = standardData.grandStaffs[gi]?.staves[TIME_SIGNATURE_STAFF_INDEX]
  const target = grandStaff.staves[TIME_SIGNATURE_STAFF_INDEX]
  if (!source || !target) return
  target.measures.forEach((measure, mi) => {
    const ts = source.measures[mi]?.timeSignature_f
    if (ts) measure.timeSignature_f = structuredClone(ts)
  })
})

export default data
