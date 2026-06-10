import {KeySignatureTypeEnum} from 'deciphony-renderer'
import staffData from './其多列'
import {convertStandardStaffToNumberNotation} from './scoreBuilder'

/**
 * 「其多列」简谱版：结构与五线谱版一致（双复谱表、多列、反复与连音线），
 * 由五线谱数据按 F 调首调唱名自动换算 syllable / octaveDot。
 */
const data = convertStandardStaffToNumberNotation(staffData, KeySignatureTypeEnum.F)

export default data
