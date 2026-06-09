import type {SkinPack} from 'deciphony-renderer'
import {buildThemedSkinPack} from './build/buildThemedSkinPack'
import {bambooForestTheme} from './theme/bambooForestTheme'

/**
 * 竹林皮肤包：以竹枝、竹籽、落叶、露珠、鸟鸣等自然意象重释记谱符号，
 * 不必形似传统音符。几何尺寸继承 defaultSkin。
 */
export const bambooForestSkin: SkinPack = buildThemedSkinPack(bambooForestTheme)
