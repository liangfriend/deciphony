import {StandardStaffSkinKeyEnum} from 'deciphony-renderer'
import type {SkinItem} from 'deciphony-renderer'
import type {SkinTheme} from '../theme/types'

const STAFF_YS = [0.5, 11.5, 22.5, 33.5, 44.5]

function pid(theme: SkinTheme, name: string) {
    return `${theme.id}-${name}`
}

function leafPath() {
    return 'M0 0 C5 -3 12 -3 16 0 C12 5 5 5 0 0 Z'
}

// ─── 小节 ───────────────────────────────────────────

function bambooMeasure(theme: SkinTheme): string {
    const id = pid(theme, 'm')
    const lines = STAFF_YS.map((y, i) => {
        const thick = i === 2 ? 2.8 : 2.2
        const op = i === 2 ? 0.72 : 0.45 + i * 0.04
        return `<rect x="0" y="${y - thick / 2}" width="node.w" height="${thick}" rx="${thick}" fill="url(#${id}-stalk)" opacity="${op}"/>`
    }).join('')
    const nodes = STAFF_YS.map((y, i) =>
        i % 2 === 0 ? `<ellipse cx="14" cy="${y}" rx="2.8" ry="1.4" fill="${theme.ink}" opacity="0.35"/>` : '',
    ).join('')
    return `<defs>
  <linearGradient id="${id}-stalk" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${theme.staffLineMuted}"/>
    <stop offset="45%" stop-color="${theme.staffLine}"/>
    <stop offset="100%" stop-color="${theme.staffLineMuted}"/>
  </linearGradient>
  <linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.accent}"/>
    <stop offset="100%" stop-color="${theme.noteHeadFill}"/>
  </linearGradient>
</defs>
<rect width="node.w" height="node.h" fill="transparent"/>
${lines}
<g opacity="0.5" stroke="${theme.ink}" stroke-width="0.8" fill="none" stroke-linecap="round">
  <path d="M6 0 C20 8 18 28 8 40"/>
  <path d="M calc(node.w * 0.92) 6 C calc(node.w * 0.96) 14 calc(node.w * 0.94) 30 calc(node.w * 0.88) 42"/>
</g>
${nodes}
<g opacity="0.88">
  <path d="${leafPath()}" transform="translate(10,4) rotate(-28) scale(1.3)" fill="url(#${id}-leaf)"/>
  <path d="${leafPath()}" transform="translate(calc(node.w - 24), 34) rotate(22) scale(1.1)" fill="url(#${id}-leaf)"/>
  <circle cx="calc(node.w * 0.42)" cy="8" r="1.1" fill="${theme.glow}" opacity="0.7"/>
  <circle cx="calc(node.w * 0.68)" cy="38" r="0.9" fill="${theme.glow}" opacity="0.55"/>
</g>`
}

function glacierMeasure(theme: SkinTheme): string {
    const id = pid(theme, 'm')
    const lines = STAFF_YS.map((y, i) => {
        const isMid = i === 2
        const w = isMid ? 1.5 : 1.1
        const op = isMid ? 0.92 : 0.72
        const color = isMid ? theme.staffLine : theme.staffLineMuted
        return `<g>
      <line x1="0" y1="${y}" x2="node.w" y2="${y}" stroke="${theme.inkStroke}" stroke-width="${w + 0.6}" stroke-linecap="round" opacity="${op * 0.18}"/>
      <line x1="0" y1="${y}" x2="node.w" y2="${y}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>
    </g>`
    }).join('')
    const flakes = [
        [18, 6, 0.8], [42, 18, 0.6], [80, 4, 0.7], [120, 32, 0.55],
    ].map(([x, y, s]) =>
        `<g transform="translate(${x},${y}) scale(${s})" opacity="0.5" stroke="${theme.staffLineMuted}" fill="none" stroke-width="0.35">
      <path d="M0-4 L0 4 M-3.5-2 L3.5 2 M-3.5 2 L3.5-2"/>
    </g>`,
    ).join('')
    return `<defs>
  <linearGradient id="${id}-wash" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.staffLineMuted}" stop-opacity="0.14"/>
    <stop offset="50%" stop-color="${theme.barlineHeavy}" stop-opacity="0.1"/>
    <stop offset="100%" stop-color="${theme.staffLineMuted}" stop-opacity="0.14"/>
  </linearGradient>
  <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${theme.staffLine}" stop-opacity="0.06"/>
    <stop offset="50%" stop-color="${theme.glow}" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="${theme.staffLine}" stop-opacity="0.06"/>
  </linearGradient>
</defs>
<rect width="node.w" height="node.h" fill="transparent"/>
<rect x="0" y="0" width="node.w" height="node.h" rx="2" fill="url(#${id}-wash)"/>
<rect x="0" y="0" width="node.w" height="node.h" fill="url(#${id}-sheen)"/>
${lines}
<g opacity="0.22" fill="none" stroke="${theme.staffLine}" stroke-width="0.6">
  <path d="M0 22 Q calc(node.w * 0.25) 18 calc(node.w * 0.5) 22 T node.w 22"/>
</g>
${flakes}
<circle cx="calc(node.w - 10)" cy="10" r="2" fill="${theme.staffLineMuted}" opacity="0.35"/>
<circle cx="8" cy="36" r="1.5" fill="${theme.staffLine}" opacity="0.3"/>`
}

// ─── 音符头：竹籽 / 冰晶 ─────────────────────────────

function bambooNoteHead(theme: SkinTheme, key: StandardStaffSkinKeyEnum): string {
    const id = pid(theme, 'nh')
    if (key === StandardStaffSkinKeyEnum.NoteHead_1) {
        return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.accentSoft}"/><stop offset="100%" stop-color="${theme.noteHeadFill}"/>
    </linearGradient></defs>
    <ellipse cx="8" cy="5" rx="7.5" ry="4.8" fill="none" stroke="${theme.noteHeadStroke}" stroke-width="1.4"/>
    <ellipse cx="8" cy="5" rx="5.5" ry="3.2" fill="url(#${id})" opacity="0.35"/>
    <path d="M4 5 Q8 2 12 5" fill="none" stroke="${theme.glow}" stroke-width="0.6" opacity="0.8"/>`
    }
    if (key === StandardStaffSkinKeyEnum.NoteHead_2) {
        return `<defs><radialGradient id="${id}" cx="35%" cy="30%"><stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.noteHeadFill}"/></radialGradient></defs>
    <ellipse cx="7.5" cy="5.5" rx="7" ry="4.5" transform="rotate(-18 7.5 5.5)" fill="url(#${id})" stroke="${theme.noteHeadStroke}" stroke-width="0.8"/>
    <ellipse cx="9" cy="4" rx="2" ry="1" fill="${theme.glow}" opacity="0.55" transform="rotate(-18 9 4)"/>`
    }
    return `<ellipse cx="7.5" cy="5.5" rx="7" ry="4.5" transform="rotate(-18 7.5 5.5)" fill="${theme.ink}" opacity="0.9"/>
    <path d="${leafPath()}" transform="translate(11,1) rotate(40) scale(0.55)" fill="${theme.noteHeadFill}" opacity="0.85"/>`
}

function glacierNoteHead(theme: SkinTheme, key: StandardStaffSkinKeyEnum): string {
    const id = pid(theme, 'nh')
    const gem = (filled: boolean) => {
        const fill = filled ? `fill="url(#${id})"` : 'fill="none"'
        return `<g transform="translate(1,0) rotate(-18 7 5)">
      <polygon points="7,1 13,5 7,10 1,5" ${fill} stroke="${theme.noteHeadStroke}" stroke-width="0.9" stroke-linejoin="round"/>
      <line x1="7" y1="1" x2="7" y2="10" stroke="${theme.accent}" stroke-width="0.4" opacity="0.7"/>
      <line x1="1" y1="5" x2="13" y2="5" stroke="${theme.glow}" stroke-width="0.35" opacity="0.5"/>
    </g>`
    }
    if (key === StandardStaffSkinKeyEnum.NoteHead_1) {
        return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accentSoft}"/><stop offset="100%" stop-color="${theme.noteHeadFill}" stop-opacity="0.3"/>
    </linearGradient></defs>${gem(false)}`
    }
    if (key === StandardStaffSkinKeyEnum.NoteHead_2) {
        return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accent}"/><stop offset="50%" stop-color="${theme.noteHeadFill}"/><stop offset="100%" stop-color="${theme.noteHeadStroke}"/>
    </linearGradient></defs>${gem(true)}<circle cx="10" cy="3" r="1.2" fill="${theme.glow}" opacity="0.8"/>`
    }
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.noteHeadFill}"/><stop offset="100%" stop-color="${theme.ink}"/>
  </linearGradient></defs>
  <polygon points="7,1 13,5.5 7,10 1,5.5" fill="url(#${id})" stroke="${theme.noteHeadStroke}" stroke-width="0.6" transform="rotate(-18 7 5.5)"/>`
}

// ─── 休止符：风止 / 冰封 ─────────────────────────────

function bambooRest(theme: SkinTheme, key: StandardStaffSkinKeyEnum): string {
    const id = pid(theme, 'r')
    if (key === StandardStaffSkinKeyEnum.Rest_1 || key === StandardStaffSkinKeyEnum.Rest_2) {
        return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.restFill}"/><stop offset="100%" stop-color="${theme.staffLineMuted}"/>
    </linearGradient></defs>
    <ellipse cx="5" cy="3" rx="5" ry="2.5" fill="url(#${id})" opacity="0.85"/>
    <path d="M1 3 Q5 1 9 3" fill="none" stroke="${theme.restStroke}" stroke-width="0.5" opacity="0.5"/>`
    }
    const leafCount = {
        [StandardStaffSkinKeyEnum.Rest_3]: 1,
        [StandardStaffSkinKeyEnum.Rest_4]: 2,
        [StandardStaffSkinKeyEnum.Rest_5]: 3,
        [StandardStaffSkinKeyEnum.Rest_6]: 4,
        [StandardStaffSkinKeyEnum.Rest_7]: 5,
        [StandardStaffSkinKeyEnum.Rest_8]: 6,
        [StandardStaffSkinKeyEnum.Rest_9]: 7,
    }[key] ?? 2
    const leaves = Array.from({length: leafCount}, (_, i) => {
        const rot = -30 + i * 18
        const ty = i * 2.5
        return `<path d="${leafPath()}" transform="translate(${3 + i * 0.8},${ty}) rotate(${rot}) scale(${0.9 - i * 0.05})"
      fill="${theme.restFill}" stroke="${theme.restStroke}" stroke-width="0.3" opacity="${0.95 - i * 0.08}"/>`
    }).join('')
    return `<g opacity="0.9">${leaves}
    <path d="M0 ${leafCount * 2 + 4} Q4 ${leafCount * 2 + 2} 8 ${leafCount * 2 + 4}" fill="none" stroke="${theme.restStroke}" stroke-width="0.4" opacity="0.35" stroke-dasharray="1 2"/>
  </g>`
}

function glacierRest(theme: SkinTheme, key: StandardStaffSkinKeyEnum): string {
    const id = pid(theme, 'r')
    if (key === StandardStaffSkinKeyEnum.Rest_1 || key === StandardStaffSkinKeyEnum.Rest_2) {
        return `<ellipse cx="5" cy="3" rx="5" ry="2" fill="${theme.accentSoft}" stroke="${theme.restStroke}" stroke-width="0.5" opacity="0.9"/>
    <ellipse cx="5" cy="2.5" rx="3" ry="1" fill="${theme.glow}" opacity="0.4"/>`
    }
    const tiers = {
        [StandardStaffSkinKeyEnum.Rest_3]: 1,
        [StandardStaffSkinKeyEnum.Rest_4]: 2,
        [StandardStaffSkinKeyEnum.Rest_5]: 3,
        [StandardStaffSkinKeyEnum.Rest_6]: 4,
        [StandardStaffSkinKeyEnum.Rest_7]: 5,
        [StandardStaffSkinKeyEnum.Rest_8]: 6,
        [StandardStaffSkinKeyEnum.Rest_9]: 7,
    }[key] ?? 2
    const icicles = Array.from({length: tiers}, (_, i) => {
        const x = 1 + i * 1.2
        const h = 4 + i * 2.5
        return `<path d="M${x} 0 L${x + 1.2} 0 L${x + 0.6} ${h} Z" fill="url(#${id})" opacity="${0.9 - i * 0.06}"/>`
    }).join('')
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.accent}"/><stop offset="100%" stop-color="${theme.restFill}"/>
  </linearGradient></defs>${icicles}
  <ellipse cx="5" cy="1" rx="4" ry="1.2" fill="${theme.glow}" opacity="0.45"/>`
}

// ─── 谱号：鸟鸣竹枝 / 冰瀑 ───────────────────────────

/** 创意谱号按 defaultSkin 的 w/h 等比缩放 */
function clefFitScale(base: SkinItem, designW: number, designH: number): number {
    const sx = (base.w || designW) / designW
    const sy = (base.h || designH) / designH
    return Math.min(sx, sy)
}

function bambooClef(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    const id = pid(theme, 'c')
    const isBass = key.includes('Bass')
    const isAlto = key.includes('Alto') || key.includes('Tenor')
    if (isBass) {
        const sc = clefFitScale(base, 22, 40)
        return `<g transform="scale(${sc})"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.accent}"/><stop offset="100%" stop-color="${theme.noteHeadFill}"/>
    </linearGradient></defs>
    <rect x="4" y="2" width="5" height="38" rx="2.5" fill="url(#${id})" stroke="${theme.ink}" stroke-width="0.6"/>
    <rect x="14" y="2" width="5" height="38" rx="2.5" fill="url(#${id})" stroke="${theme.ink}" stroke-width="0.6" opacity="0.85"/>
    <ellipse cx="6.5" cy="12" rx="1.5" ry="0.8" fill="${theme.ink}" opacity="0.4"/>
    <ellipse cx="16.5" cy="28" rx="1.5" ry="0.8" fill="${theme.ink}" opacity="0.4"/>
    <circle cx="6.5" cy="32" r="2.8" fill="${theme.noteHeadFill}" stroke="${theme.ink}" stroke-width="0.5"/>
    <circle cx="16.5" cy="18" r="2.8" fill="${theme.noteHeadFill}" stroke="${theme.ink}" stroke-width="0.5"/></g>`
    }
    if (isAlto) {
        const sc = clefFitScale(base, 18, 36)
        return `<g transform="scale(${sc})"><path d="M4 4 C14 4 14 20 4 20 C14 20 14 36 4 36"
      fill="none" stroke="${theme.noteHeadFill}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="4" cy="20" r="2" fill="${theme.glow}"/></g>`
    }
    const sc = clefFitScale(base, 18, 40)
    return `<g transform="scale(${sc})"><defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0%" stop-color="${theme.ink}"/><stop offset="100%" stop-color="${theme.noteHeadFill}"/>
  </linearGradient></defs>
  <path d="M10 38 C6 30 5 20 8 10 C10 4 14 2 16 6 C18 12 14 22 12 32 C11 36 10 38 10 38 Z" fill="url(#${id})"/>
  <path d="M8 6 C4 14 3 26 6 36" fill="none" stroke="${theme.staffLine}" stroke-width="1.2" stroke-linecap="round"/>
  <path d="${leafPath()}" transform="translate(14,8) rotate(-15) scale(0.9)" fill="${theme.noteHeadFill}"/>
  <path d="M12 4 C14 2 17 3 16 6 C15 8 13 7 12 4 Z" fill="${theme.accentSoft}" stroke="${theme.ink}" stroke-width="0.3"/>
  <circle cx="14" cy="5" r="0.8" fill="${theme.ink}"/></g>`
}

function glacierClef(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    const id = pid(theme, 'c')
    const isBass = key.includes('Bass')
    const isAlto = key.includes('Alto') || key.includes('Tenor')
    if (isBass) {
        const sc = clefFitScale(base, 22, 40)
        return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.staffLineMuted}"/><stop offset="100%" stop-color="${theme.barlineHeavy}"/>
    </linearGradient></defs>
    <g transform="scale(${sc})">
    <polygon points="6,2 10,2 8,38 4,38" fill="url(#${id})" stroke="${theme.inkStroke}" stroke-width="0.7"/>
    <polygon points="16,2 20,2 18,38 14,38" fill="url(#${id})" stroke="${theme.ink}" stroke-width="0.8"/>
    <circle cx="8" cy="30" r="3" fill="${theme.staffLine}" stroke="${theme.inkStroke}" stroke-width="0.5"/>
    <circle cx="18" cy="14" r="3" fill="${theme.staffLine}" stroke="${theme.inkStroke}" stroke-width="0.5"/></g>`
    }
    if (isAlto) {
        const sc = clefFitScale(base, 18, 36)
        return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.staffLineMuted}"/><stop offset="100%" stop-color="${theme.staffLine}"/>
    </linearGradient></defs>
    <g transform="scale(${sc})"><path d="M6 6 C16 6 16 38 6 38" fill="none" stroke="${theme.inkStroke}" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>
    <path d="M6 6 C16 6 16 38 6 38" fill="none" stroke="url(#${id})" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="6" cy="22" r="2.5" fill="${theme.barlineHeavy}" stroke="${theme.ink}" stroke-width="0.5"/></g>`
    }
    const sc = clefFitScale(base, 18, 40)
    return `<g transform="scale(${sc})"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.staffLineMuted}"/><stop offset="45%" stop-color="${theme.barlineHeavy}"/><stop offset="100%" stop-color="${theme.inkStroke}"/>
  </linearGradient></defs>
  <path d="M14 4 C8 12 6 24 8 36 C9 40 12 40 13 36 C15 28 16 16 14 4 Z" fill="url(#${id})" stroke="${theme.ink}" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="M12 8 C10 18 10 30 12 38" fill="none" stroke="${theme.accentSoft}" stroke-width="1" opacity="0.9"/>
  <path d="M15 6 L17 10 L14 12 Z" fill="${theme.staffLine}" stroke="${theme.inkStroke}" stroke-width="0.4"/>
  <circle cx="16" cy="8" r="1.2" fill="${theme.accentSoft}" stroke="${theme.ink}" stroke-width="0.35"/></g>`
}

// ─── 变音：新芽 / 冰棱 ───────────────────────────────

function bambooAccidental(theme: SkinTheme, key: StandardStaffSkinKeyEnum): string {
    if (key === StandardStaffSkinKeyEnum.Sharp) {
        return `<g stroke-linecap="round">
      <line x1="6" y1="2" x2="6" y2="28" stroke="${theme.accidentalStroke}" stroke-width="1.8"/>
      <line x1="11" y1="0" x2="11" y2="26" stroke="${theme.accidentalStroke}" stroke-width="1.8"/>
      <path d="M2 10 L15 7 L15 12 L2 15 Z" fill="${theme.accidentalFill}"/>
      <path d="M2 20 L15 17 L15 22 L2 25 Z" fill="${theme.accidentalFill}"/>
      <circle cx="6" cy="10" r="1.2" fill="${theme.glow}"/><circle cx="11" cy="20" r="1.2" fill="${theme.glow}"/>
    </g>`
    }
    if (key === StandardStaffSkinKeyEnum.Flat) {
        return `<path d="M10 2 C10 2 10 28 10 28 M10 18 C4 22 2 26 6 28 C10 26 10 18 10 18 Z"
      fill="${theme.accidentalFill}" stroke="${theme.accidentalStroke}" stroke-width="1.2" stroke-linecap="round"/>`
    }
    if (key === StandardStaffSkinKeyEnum.Natural) {
        return `<path d="M8 2 L8 14 L14 10 L14 28 L8 24 L8 16 L4 20 L4 6 Z"
      fill="${theme.accentSoft}" stroke="${theme.accidentalStroke}" stroke-width="1" stroke-linejoin="round"/>`
    }
    if (key === StandardStaffSkinKeyEnum.Double_sharp) {
        return `<g>
      <path d="M4 4 L10 16 M10 4 L4 16" stroke="${theme.accidentalStroke}" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 4 L18 16 M18 4 L12 16" stroke="${theme.accidentalFill}" stroke-width="2" stroke-linecap="round"/>
    </g>`
    }
    return `<g>
    <path d="M4 6 C2 14 2 22 6 28" fill="none" stroke="${theme.accidentalStroke}" stroke-width="1.5"/>
    <path d="M14 6 C16 14 16 22 12 28" fill="none" stroke="${theme.accidentalStroke}" stroke-width="1.5"/>
    <path d="${leafPath()}" transform="translate(7,14) scale(0.7)" fill="${theme.accidentalFill}"/>
  </g>`
}

function glacierAccidental(theme: SkinTheme, key: StandardStaffSkinKeyEnum): string {
    if (key === StandardStaffSkinKeyEnum.Sharp) {
        return `<g>
      <polygon points="6,2 8,2 8,28 6,28" fill="${theme.accidentalFill}"/>
      <polygon points="11,0 13,0 13,26 11,26" fill="${theme.accidentalStroke}" opacity="0.8"/>
      <polygon points="1,9 15,6 15,11 1,14" fill="${theme.glow}" opacity="0.7"/>
      <polygon points="1,19 15,16 15,21 1,24" fill="${theme.glow}" opacity="0.7"/>
    </g>`
    }
    if (key === StandardStaffSkinKeyEnum.Flat) {
        return `<path d="M10 0 L10 30 L4 26 L4 14 L10 10 Z" fill="url(#${pid(theme, 'af')})" stroke="${theme.accidentalStroke}" stroke-width="0.6"/>
    <defs><linearGradient id="${pid(theme, 'af')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accent}"/><stop offset="100%" stop-color="${theme.accidentalFill}"/>
    </linearGradient></defs>`
    }
    if (key === StandardStaffSkinKeyEnum.Natural) {
        return `<polygon points="4,6 4,18 8,14 8,28 14,24 14,12 10,16 10,4" fill="${theme.accentSoft}" stroke="${theme.accidentalStroke}" stroke-width="0.8"/>`
    }
    if (key === StandardStaffSkinKeyEnum.Double_sharp) {
        return `<g stroke="${theme.accidentalStroke}" stroke-width="1.8" stroke-linecap="round">
      <path d="M3 3 L11 15"/><path d="M11 3 L3 15"/>
      <path d="M13 3 L21 15"/><path d="M21 3 L13 15"/>
    </g>`
    }
    return `<g opacity="0.9">
    <path d="M5 4 L3 28 M13 4 L15 28" stroke="${theme.accidentalStroke}" stroke-width="1.2"/>
    <path d="M4 14 L14 10 M4 20 L14 24" stroke="${theme.glow}" stroke-width="0.8"/>
  </g>`
}

// ─── 小节线：竹节 / 冰柱 ─────────────────────────────

function bambooBarline(theme: SkinTheme, key: string, h: number): string {
    const id = pid(theme, 'bl')
    const stalk = (x: number, w: number, heavy = false) =>
        `<rect x="${x - w / 2}" y="0" width="${w}" height="${h}" rx="${w / 2}" fill="url(#${id})" opacity="${heavy ? 1 : 0.85}"/>
     ${heavy ? '' : `<ellipse cx="${x}" cy="${h * 0.3}" rx="${w * 0.6}" ry="0.8" fill="${theme.ink}" opacity="0.25"/>`}`
    const dot = (cx: number, cy: number) =>
        `<circle cx="${cx}" cy="${cy}" r="2" fill="${theme.glow}" stroke="${theme.ink}" stroke-width="0.4"/>
     <circle cx="${cx}" cy="${cy}" r="0.8" fill="${theme.accentSoft}"/>`

    const defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.accent}"/><stop offset="100%" stop-color="${theme.barlineHeavy}"/>
  </linearGradient></defs>`

    if (key.includes('final') || key === StandardStaffSkinKeyEnum.Final_barline) {
        return `${defs}${stalk(3, 2)}${stalk(7, 4, true)}`
    }
    if (key.includes('double')) return `${defs}${stalk(4, 2.2)}${stalk(7, 2.2)}`
    if (key.includes('heavy')) return `${defs}${stalk(5, 4, true)}`
    if (key.includes('StartRepeat') || key.includes('startRepeat')) {
        return `${defs}${stalk(6, 3.5, true)}${stalk(10, 2.5)}${dot(14, 15)}${dot(14, 30)}`
    }
    if (key.includes('EndRepeat') || key.includes('endRepeat')) {
        return `${defs}${dot(4, 15)}${dot(4, 30)}${stalk(8, 2.5)}${stalk(12, 3.5, true)}`
    }
    if (key.includes('dashed')) {
        return `${defs}<g>${[0, 8, 16, 24, 32, 40].map(y => `<rect x="3.5" y="${y}" width="3" height="4" rx="1.5" fill="url(#${id})"/>`).join('')}</g>`
    }
    if (key.includes('dotted')) {
        return `${defs}<g>${[3, 10, 17, 24, 31, 38].map(y => `<circle cx="5" cy="${y}" r="1.2" fill="${theme.barlineHeavy}"/>`).join('')}</g>`
    }
    if (key.includes('reverse')) return `${defs}${stalk(7, 4, true)}${stalk(3, 2)}`
    if (key.includes('start_end') || key.includes('Start_end')) {
        return `${defs}${dot(4, 15)}${dot(4, 30)}${stalk(8, 2.5)}${stalk(12, 3.5, true)}${stalk(16, 2.5)}${dot(20, 15)}${dot(20, 30)}`
    }
    if (key === 'close_line' || key === 'linked_close_line') {
        return `${defs}${stalk(2, 3, true)}<path d="M0 0 C6 10 6 35 0 ${h}" fill="none" stroke="${theme.staffLineMuted}" stroke-width="0.8" opacity="0.4"/>`
    }
    return `${defs}${stalk(4.5, 2.5)}`
}

function glacierBarline(theme: SkinTheme, key: string, h: number): string {
    const id = pid(theme, 'bl')
    const pillar = (x: number, w: number) =>
        `<rect x="${x - w / 2}" y="0" width="${w}" height="${h}" fill="url(#${id})" opacity="0.9"/>
     <line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${theme.glow}" stroke-width="0.4" opacity="0.6"/>`
    const crystal = (cx: number, cy: number) =>
        `<polygon points="${cx},${cy - 2} ${cx + 2},${cy} ${cx},${cy + 2} ${cx - 2},${cy}" fill="${theme.glow}" opacity="0.85"/>`
    const defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.accent}"/><stop offset="50%" stop-color="${theme.barlineHeavy}"/><stop offset="100%" stop-color="${theme.ink}"/>
  </linearGradient></defs>`

    if (key.includes('final')) return `${defs}${pillar(3, 1.5)}${pillar(7, 3.5)}`
    if (key.includes('double')) return `${defs}${pillar(4, 1.5)}${pillar(7, 1.5)}`
    if (key.includes('StartRepeat') || key.includes('startRepeat')) {
        return `${defs}${pillar(6, 3)}${pillar(10, 2)}${crystal(14, 15)}${crystal(14, 30)}`
    }
    if (key.includes('EndRepeat') || key.includes('endRepeat')) {
        return `${defs}${crystal(4, 15)}${crystal(4, 30)}${pillar(8, 2)}${pillar(12, 3)}`
    }
    if (key.includes('dashed')) {
        return `${defs}<line x1="5" y1="0" x2="5" y2="${h}" stroke="${theme.barlineHeavy}" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.8"/>`
    }
    if (key.includes('dotted')) {
        return `${defs}<g>${[4, 11, 18, 25, 32, 39].map(y => crystal(5, y)).join('')}</g>`
    }
    if (key.includes('reverse')) return `${defs}${pillar(7, 3.5)}${pillar(3, 1.5)}`
    if (key.includes('heavy_double')) return `${defs}${pillar(5, 3.5)}${pillar(10, 3.5)}`
    if (key.includes('start_end') || key.includes('Start_end')) {
        return `${defs}${crystal(4, 15)}${crystal(4, 30)}${pillar(8, 2)}${pillar(12, 3)}${pillar(16, 2)}${crystal(20, 15)}${crystal(20, 30)}`
    }
    if (key === 'close_line' || key === 'linked_close_line') {
        return `${defs}${pillar(2, 3)}<path d="M0 0 Q8 ${h / 2} 0 ${h}" fill="${theme.accentSoft}" opacity="0.15"/>`
    }
    return `${defs}${pillar(4.5, 2)}`
}

// ─── 拍号 / 附点 / 符干 / 符尾 / 加线 ─────────────────

function bambooTimeSig(theme: SkinTheme, top: string, bottom: string): string {
    const id = pid(theme, 'ts')
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.accentSoft}"/><stop offset="100%" stop-color="${theme.staffLineMuted}"/>
  </linearGradient></defs>
  <rect x="2" y="2" width="26" height="41" rx="4" fill="url(#${id})" stroke="${theme.ink}" stroke-width="0.8" opacity="0.5"/>
  <text x="15" y="22" text-anchor="middle" font-size="20" font-weight="${theme.timeSigFontWeight}" fill="${theme.timeSigColor}" font-family="Georgia, serif">${top}</text>
  <line x1="6" y1="24" x2="24" y2="24" stroke="${theme.ink}" stroke-width="0.5" opacity="0.3"/>
  <text x="15" y="42" text-anchor="middle" font-size="20" font-weight="${theme.timeSigFontWeight}" fill="${theme.timeSigColor}" font-family="Georgia, serif">${bottom}</text>
  <path d="${leafPath()}" transform="translate(24,2) rotate(30) scale(0.5)" fill="${theme.noteHeadFill}" opacity="0.7"/>`
}

function glacierTimeSig(theme: SkinTheme, top: string, bottom: string): string {
    const id = pid(theme, 'ts')
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.accentSoft}"/><stop offset="100%" stop-color="${theme.glow}"/>
  </linearGradient></defs>
  <polygon points="15,0 28,8 28,38 15,45 2,38 2,8" fill="url(#${id})" stroke="${theme.ink}" stroke-width="0.6" opacity="0.45"/>
  <text x="15" y="22" text-anchor="middle" font-size="20" font-weight="${theme.timeSigFontWeight}" fill="${theme.timeSigColor}">${top}</text>
  <text x="15" y="42" text-anchor="middle" font-size="20" font-weight="${theme.timeSigFontWeight}" fill="${theme.timeSigColor}" opacity="0.85">${bottom}</text>`
}

function bambooDot(theme: SkinTheme, count: number): string {
    return Array.from({length: count}, (_, i) => {
        const cx = 1.5 + i * 5
        return `<g transform="translate(${cx},1.5)">
      <circle r="2" fill="${theme.glow}" opacity="0.3"/><circle r="1.4" fill="${theme.dotFill}"/>
      <ellipse cx="0.4" cy="-0.5" rx="0.6" ry="0.3" fill="${theme.accentSoft}" opacity="0.8"/>
    </g>`
    }).join('')
}

function glacierDot(theme: SkinTheme, count: number): string {
    return Array.from({length: count}, (_, i) => {
        const cx = 1.5 + i * 5
        return `<g transform="translate(${cx},1.5)">
      <circle r="2.5" fill="${theme.glow}" opacity="0.2"/>
      <circle r="1.3" fill="${theme.dotFill}" stroke="${theme.accent}" stroke-width="0.3"/>
      <path d="M0-1.5 L0.5 0 L0 1.5 L-0.5 0 Z" fill="${theme.accentSoft}" opacity="0.9"/>
    </g>`
    }).join('')
}

function bambooStem(theme: SkinTheme): string {
    const id = pid(theme, 'st')
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.accent}"/><stop offset="100%" stop-color="${theme.stemFill}"/>
  </linearGradient></defs>
  <rect width="node.w" height="node.h" rx="0.5" fill="url(#${id})"/>
  <line x1="0.3" y1="0" x2="0.3" y2="node.h" stroke="${theme.glow}" stroke-width="0.3" opacity="0.5"/>`
}

function glacierStem(theme: SkinTheme): string {
    const id = pid(theme, 'st')
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.accent}"/><stop offset="60%" stop-color="${theme.stemFill}"/><stop offset="100%" stop-color="${theme.ink}"/>
  </linearGradient></defs>
  <polygon points="0,0 1,0 0.6,node.h 0,node.h" fill="url(#${id})"/>
  <line x1="0.2" y1="0" x2="0.5" y2="node.h" stroke="${theme.glow}" stroke-width="0.25" opacity="0.7"/>`
}

function bambooTail(theme: SkinTheme, idx: number, reversed: boolean): string {
    const leaves = Math.min(idx, 4)
    const parts = Array.from({length: leaves}, (_, i) => {
        const rot = reversed ? 40 - i * 12 : -50 + i * 12
        const ty = i * 3
        return `<path d="${leafPath()}" transform="translate(${2 + i},${ty}) rotate(${rot}) scale(${0.7 - i * 0.08})"
      fill="${theme.noteHeadFill}" stroke="${theme.ink}" stroke-width="0.25" opacity="${0.95 - i * 0.1}"/>`
    }).join('')
    const flip = reversed ? 'scale(1,-1) translate(0,-node.h)' : ''
    return `<g transform="${flip}">${parts}
    <path d="M0 0 Q3 8 1 16" fill="none" stroke="${theme.staffLine}" stroke-width="0.6" opacity="0.4" stroke-linecap="round"/>
  </g>`
}

function glacierTail(theme: SkinTheme, idx: number, reversed: boolean): string {
    const wisps = Math.min(idx, 4)
    const parts = Array.from({length: wisps}, (_, i) =>
        `<path d="M1 ${i * 4} Q5 ${i * 4 + 6} 2 ${i * 4 + 12}" fill="none" stroke="${theme.glow}" stroke-width="${1.2 - i * 0.15}" opacity="${0.8 - i * 0.12}" stroke-linecap="round"/>`,
    ).join('')
    const flip = reversed ? 'scale(1,-1) translate(0,-node.h)' : ''
    return `<g transform="${flip}">${parts}</g>`
}

function bambooAddLine(theme: SkinTheme): string {
    return `<line x1="0" y1="5.5" x2="16" y2="5.5" stroke="${theme.ledgerLine}" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="1" y1="5.5" x2="15" y2="5.5" stroke="${theme.accentSoft}" stroke-width="0.5" opacity="0.6"/>
  <path d="${leafPath()}" transform="translate(14,3) rotate(20) scale(0.35)" fill="${theme.noteHeadFill}" opacity="0.6"/>`
}

function glacierAddLine(theme: SkinTheme): string {
    return `<line x1="0" y1="5.5" x2="16" y2="5.5" stroke="${theme.ledgerLine}" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="14" cy="5.5" r="1" fill="${theme.glow}" opacity="0.5"/>`
}

function bambooNumberGlyph(theme: SkinTheme, digit: string): string {
    return `<text x="10" y="28" text-anchor="middle" font-size="24" font-weight="${theme.timeSigFontWeight}"
    fill="${theme.timeSigColor}" font-family="Georgia, serif">${digit}</text>
  <ellipse cx="10" cy="30" rx="8" ry="2" fill="${theme.staffLineMuted}" opacity="0.2"/>`
}

function glacierNumberGlyph(theme: SkinTheme, digit: string): string {
    return `<text x="10" y="28" text-anchor="middle" font-size="24" font-weight="${theme.timeSigFontWeight}"
    fill="${theme.timeSigColor}" stroke="${theme.glow}" stroke-width="0.3">${digit}</text>`
}

function bambooNumberMeasure(theme: SkinTheme): string {
    return `<rect x="0" y="0" width="node.w" height="45" fill="${theme.accentSoft}" opacity="0.12"/>
  <line x1="0" y1="22.5" x2="node.w" y2="22.5" stroke="${theme.staffLine}" stroke-width="0.8" opacity="0.25" stroke-dasharray="6 8"/>`
}

function glacierNumberMeasure(theme: SkinTheme): string {
    const id = pid(theme, 'nm')
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${theme.staffLineMuted}" stop-opacity="0.16"/>
    <stop offset="100%" stop-color="${theme.staffLine}" stop-opacity="0.08"/>
  </linearGradient></defs>
  <rect x="0" y="0" width="node.w" height="45" fill="url(#${id})"/>
  <line x1="0" y1="22.5" x2="node.w" y2="22.5" stroke="${theme.staffLine}" stroke-width="0.9" opacity="0.55" stroke-linecap="round"/>`
}

/** 调号：保留 base 的位移，把每组内的形状换成主题化迷你变音符号 */
function creativeKeySignature(theme: SkinTheme, key: string, base: SkinItem): string {
    if (!base.content.trim()) return base.content
    const isFlat = /_flat/.test(key) || (/fill="transparent"/.test(base.content) && !/<rect[^>]*height="28/.test(base.content))
    const accKey = isFlat ? StandardStaffSkinKeyEnum.Flat : StandardStaffSkinKeyEnum.Sharp
    const mini = theme.measureVariant === 'bamboo'
        ? `<g transform="scale(0.55)">${bambooAccidental(theme, accKey)}</g>`
        : `<g transform="scale(0.55)">${glacierAccidental(theme, accKey)}</g>`
    const transforms = [...base.content.matchAll(/<g transform="([^"]+)"/g)].map(m => m[1])
    if (!transforms.length) {
        return `<g transform="scale(0.4)">${theme.measureVariant === 'bamboo' ? bambooAccidental(theme, accKey) : glacierAccidental(theme, accKey)}</g>`
    }
    return transforms.map(t => `<g transform="${t}">${mini}</g>`).join('')
}

function bambooGeneric(theme: SkinTheme, base: SkinItem): string {
    if (!base.content.trim()) return base.content
    return base.content
        .replace(/fill="black"/g, `fill="${theme.ink}"`)
        .replace(/stroke="black"/g, `stroke="${theme.inkStroke}"`)
}

function glacierGeneric(theme: SkinTheme, base: SkinItem): string {
    if (!base.content.trim()) return base.content
    return base.content
        .replace(/fill="black"/g, `fill="${theme.noteHeadFill}"`)
        .replace(/stroke="black"/g, `stroke="${theme.inkStroke}"`)
}

// ─── 统一出口 ─────────────────────────────────────────

export function buildCreativeContent(
    theme: SkinTheme,
    category: string,
    key: string,
    base: SkinItem,
): string | undefined {
    const bamboo = theme.measureVariant === 'bamboo'
    const enumKey = key as StandardStaffSkinKeyEnum
    const h = base.h || 45

    switch (category) {
        case 'measure':
            return bamboo ? bambooMeasure(theme) : glacierMeasure(theme)
        case 'noteHead':
            return bamboo ? bambooNoteHead(theme, enumKey) : glacierNoteHead(theme, enumKey)
        case 'rest':
            return bamboo ? bambooRest(theme, enumKey) : glacierRest(theme, enumKey)
        case 'clef':
            return bamboo ? bambooClef(theme, enumKey, base) : glacierClef(theme, enumKey, base)
        case 'accidental':
            return bamboo ? bambooAccidental(theme, enumKey) : glacierAccidental(theme, enumKey)
        case 'barline':
            return bamboo ? bambooBarline(theme, key, h) : glacierBarline(theme, key, h)
        case 'keySignature':
            return creativeKeySignature(theme, key, base)
        case 'timeSignature': {
            const m = base.content.match(/>(\d+)<\/text>[\s\S]*?>(\d+)<\/text>/)
            if (!m) return undefined
            return bamboo ? bambooTimeSig(theme, m[1], m[2]) : glacierTimeSig(theme, m[1], m[2])
        }
        case 'augmentationDot': {
            const count = key.includes('_3') ? 3 : key.includes('_2') ? 2 : 1
            return bamboo ? bambooDot(theme, count) : glacierDot(theme, count)
        }
        case 'noteStem':
            return bamboo ? bambooStem(theme) : glacierStem(theme)
        case 'noteTail': {
            const idxM = key.match(/noteTail_(\d+)/)
            const idx = idxM ? Number(idxM[1]) : 1
            const rev = key.endsWith('_r')
            return bamboo ? bambooTail(theme, idx, rev) : glacierTail(theme, idx, rev)
        }
        case 'addLine':
            return bamboo ? bambooAddLine(theme) : glacierAddLine(theme)
        case 'number':
            return bamboo ? bambooNumberGlyph(theme, key.replace('number_', '').toUpperCase())
                : glacierNumberGlyph(theme, key.replace('number_', '').toUpperCase())
        case 'numberMeasure':
            return bamboo ? bambooNumberMeasure(theme) : glacierNumberMeasure(theme)
        case 'line':
            return bamboo ? bambooReduceLine(theme, key) : glacierReduceLine(theme, key)
        case 'other':
            return bamboo ? bambooGeneric(theme, base) : glacierGeneric(theme, base)
        default:
            return undefined
    }
}

function bambooReduceLine(theme: SkinTheme, key: string): string {
    if (key === 'octaveDot') {
        return `<circle cx="5" cy="5" r="2.2" fill="${theme.dotFill}" stroke="${theme.ink}" stroke-width="0.4"/>
    <circle cx="4.5" cy="4.5" r="0.8" fill="${theme.accentSoft}"/>`
    }
    if (key === 'addline') {
        return `<line x1="0" y1="4" x2="20" y2="4" stroke="${theme.staffLine}" stroke-width="2" stroke-linecap="round"/>
    <path d="${leafPath()}" transform="translate(18,2) scale(0.4)" fill="${theme.noteHeadFill}" opacity="0.7"/>`
    }
    const n = Number(key.replace('reduceLine_', '')) || 1
    return Array.from({length: n}, (_, i) =>
        `<line x1="0" y1="${4 + i * 5}" x2="18" y2="${4 + i * 5}" stroke="${theme.ink}" stroke-width="1.4" stroke-linecap="round" opacity="${0.9 - i * 0.1}"/>`,
    ).join('')
}

function glacierReduceLine(theme: SkinTheme, key: string): string {
    if (key === 'octaveDot') {
        return `<circle cx="5" cy="5" r="2" fill="${theme.glow}" opacity="0.5"/>
    <circle cx="5" cy="5" r="1.2" fill="${theme.dotFill}"/>`
    }
    if (key === 'addline') {
        return `<line x1="0" y1="4" x2="20" y2="4" stroke="${theme.staffLine}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="18" cy="4" r="1" fill="${theme.accent}" opacity="0.7"/>`
    }
    const n = Number(key.replace('reduceLine_', '')) || 1
    return Array.from({length: n}, (_, i) =>
        `<line x1="0" y1="${4 + i * 5}" x2="18" y2="${4 + i * 5}" stroke="${theme.barlineHeavy}" stroke-width="1.2" opacity="${0.85 - i * 0.08}"/>`,
    ).join('')
}
