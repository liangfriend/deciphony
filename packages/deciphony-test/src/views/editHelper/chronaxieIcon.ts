import type {Chronaxie} from '@deciphony/renderer'
import {previewRestSvgHtml, previewSvgHtml} from './standardStaff/renderEditSymbolAddAction'

/** 工具条用：去掉幽灵预览半透明，改成实色 */
function solidifySvg(html: string, color = '#303133'): string {
  return html
    .replace(/opacity="[^"]*"/g, 'opacity="1"')
    .replace(/#2066ff/gi, color)
}

/** 时值 → 符干向上的音符 SVG（内层 g/path，需包在 <svg> 里） */
export function chronaxieNoteInnerHtml(chronaxie: Chronaxie, color = '#303133'): string {
  return solidifySvg(previewSvgHtml(chronaxie, 'up'), color)
}

/** 时值 → 休止符 SVG */
export function chronaxieRestInnerHtml(chronaxie: Chronaxie, color = '#303133'): string {
  return solidifySvg(previewRestSvgHtml(chronaxie), color)
}

/** 工具条图标 viewBox：覆盖全音符到 128 分的符干范围 */
export const CHRONAXIE_ICON_VIEWBOX = '-4 -56 36 72'
