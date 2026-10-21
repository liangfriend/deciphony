/**
 * 古筝指法符号：全部由线段 / 圆弧组成，一条描边 path 画完；Bravura / SMuFL 无对应字形。
 * 形状参照常见筝谱：托 └、劈 ┐、挑 /、抹 \、勾 ⌒、剔 ◡、摇 彡；其余按约定绘制。
 * d 在 w × h 盒内（留出圆头描边余量）；皮肤内容前置同尺寸透明 rect，细线也能点中。
 * GUZHENG_GLYPHS 需保持可被 JSON.parse 的字面量（scripts/sync-guzheng-skins.mjs 直接读本文件同步 JSON 皮肤）。
 */

export type GuzhengGlyph = { d: string; w: number; h: number };

export const GUZHENG_STROKE_WIDTH = 1.3;

// prettier-ignore
export const GUZHENG_GLYPHS: Record<string, GuzhengGlyph> = {
  "guzheng_mo": {"d": "M1.5 1.5L8.5 8.5", "w": 10, "h": 10},
  "guzheng_tiao": {"d": "M1.5 8.5L8.5 1.5", "w": 10, "h": 10},
  "guzheng_gou": {"d": "M1.5 5A3.5 3.5 0 0 1 8.5 5", "w": 10, "h": 6},
  "guzheng_ti1": {"d": "M1.5 1A3.5 3.5 0 0 0 8.5 1", "w": 10, "h": 6},
  "guzheng_pi": {"d": "M1.5 1.5H8.5V8.5", "w": 10, "h": 10},
  "guzheng_tuo": {"d": "M1.5 1.5V8.5H8.5", "w": 10, "h": 10},
  "guzheng_da": {"d": "M1.5 8.5L5 1.5L8.5 8.5", "w": 10, "h": 10},
  "guzheng_zhai": {"d": "M1.5 1.5L5 8.5L8.5 1.5", "w": 10, "h": 10},
  "guzheng_ti2": {"d": "M7.5 1.5L2.5 5.5H7.5L2.5 9.5", "w": 10, "h": 11},
  "guzheng_bo": {"d": "M2.5 1.5L7.5 5.5H2.5L7.5 9.5", "w": 10, "h": 11},
  "guzheng_xiao_cuo": {"d": "M1.5 1.5V8.5H7M9 1.5L14.5 8.5", "w": 16, "h": 10},
  "guzheng_da_cuo": {"d": "M1.5 1.5V8.5H7M9 4.5A2.75 2.75 0 0 1 14.5 4.5", "w": 16, "h": 10},
  "guzheng_sao": {"d": "M1.2 4.58L8.45 1.2M3.43 7.95L9.6 5.08M4.58 11.83L11.83 8.45M4.83 2.89L8.21 10.14", "w": 13, "h": 13},
  "guzheng_yao": {"d": "M1.2 4.58L8.45 1.2M3.43 7.95L9.6 5.08M4.58 11.83L11.83 8.45", "w": 13, "h": 13}
};

/** 描边 path（无点击区） */
export function guzhengGlyphPath(glyph: GuzhengGlyph, color = 'black'): string {
  return `<path d="${glyph.d}" fill="none" stroke="${color}" stroke-width="${GUZHENG_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** 皮肤内容：透明 rect 在后（点击区）+ 描边 path */
export function guzhengSkinContent(glyph: GuzhengGlyph, color = 'black'): string {
  return `<rect x="0" y="0" width="${glyph.w}" height="${glyph.h}" fill="transparent" stroke="none"/>${guzhengGlyphPath(glyph, color)}`;
}

/** 某谱种皮肤键枚举里的古筝符号键 */
export type GuzhengSkinKeyOf<E extends string> = Extract<E, `guzheng_${string}`>;

/** 各谱种皮肤包共用的古筝符号项（skinKey 与枚举值同名）；E 为该谱种的皮肤键枚举 */
export function guzhengSkinItems<E extends string>(color = 'black'): Record<GuzhengSkinKeyOf<E>, { content: string; w: number; h: number; skinKey: GuzhengSkinKeyOf<E> }> {
  type K = GuzhengSkinKeyOf<E>;
  const out = {} as Record<K, { content: string; w: number; h: number; skinKey: K }>;
  for (const [key, glyph] of Object.entries(GUZHENG_GLYPHS)) {
    out[key as K] = {content: guzhengSkinContent(glyph, color), w: glyph.w, h: glyph.h, skinKey: key as K};
  }
  return out;
}
