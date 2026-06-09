import type {SkinPack} from 'deciphony-renderer'
import {buildThemedSkinPack} from './build/buildThemedSkinPack'
import {glacierTheme} from './theme/glacierTheme'

/**
 * 冰川皮肤包：以冰晶、极光、雪粒、冰柱、冰瀑等意象重释记谱符号，
 * 不必形似传统音符。几何尺寸继承 defaultSkin。
 */
export const glacierSkin: SkinPack = buildThemedSkinPack(glacierTheme)
