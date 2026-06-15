import {KeySignatureTypeEnum} from 'deciphony-renderer'
import standardData from './skinExhibitStandardStaff'
import {convertStandardStaffToNumberNotation} from './scoreBuilder'

/** 简谱版：与五线谱 skinExhibit 同结构，按 C 调首调换算唱名 */
const data = convertStandardStaffToNumberNotation(standardData, KeySignatureTypeEnum.C)

export default data
