/**
 * 曲谱自定义符号（MusicScore.extraNoteSymbol / extraSlotSymbol / extraMeasureSymbol）→ 皮肤包。
 * 自定义符号按 skinKey 注入每套 SkinPack 中当前谱种的符号表，排版（ctx.skin）与绘制（group.vue）都从这里取；
 * 规则挂在注入的皮肤项上，附属引擎查不到内置规则时按种类读它。内置皮肤键已存在时不覆盖。
 */
import {
    MusicScoreTypeEnum,
    SingleMeasureAffiliatedSymbolNameEnum,
    SingleNoteAffiliatedSymbolNameEnum,
    SingleSlotAffiliatedSymbolNameEnum,
    tabSkinPackKeyForType,
} from '@/enums/musicScoreEnum';
import type {
    SingleMeasureAffiliatedRule,
    SingleNoteAffiliatedRule,
    SingleSlotAffiliatedRule,
} from '@/constants/renderRules';
import type {
    ExtraMeasureSymbol,
    ExtraNoteSymbol,
    ExtraSlotSymbol,
    ExtraSymbol,
    ExtraSymbolInput,
    ExtraSymbolKind,
    ExtraSymbolMap,
    MusicScore,
} from '@/types/MusicScoreType';
import type {Skin, SkinItem, SkinPack} from '@/types/common';
import {defaultSkin} from '@/skins/defaultSkin';

export const EXTRA_SYMBOL_KINDS: readonly ExtraSymbolKind[] = ['note', 'slot', 'measure'];

/** 种类 → MusicScore 上的数组字段 */
export const EXTRA_SYMBOL_FIELDS = {
    note: 'extraNoteSymbol',
    slot: 'extraSlotSymbol',
    measure: 'extraMeasureSymbol',
} as const satisfies Record<ExtraSymbolKind, keyof MusicScore>;

/** 种类 → 对应内置规则类型 */
export type ExtraRuleMap = {
    note: SingleNoteAffiliatedRule;
    slot: SingleSlotAffiliatedRule;
    measure: SingleMeasureAffiliatedRule;
};

export type ExtraSkinItem = SkinItem & {
    extraKind?: ExtraSymbolKind;
    extraRule?: ExtraRuleMap[ExtraSymbolKind];
};

/** 曲谱某种自定义符号数组（未设置时为空数组，不写回） */
export function getExtraSymbols<K extends ExtraSymbolKind>(musicScore: MusicScore, kind: K): ExtraSymbolMap[K][] {
    return (musicScore[EXTRA_SYMBOL_FIELDS[kind]] ?? []) as ExtraSymbolMap[K][];
}

export function hasExtraSymbols(musicScore: MusicScore | null | undefined): boolean {
    if (!musicScore) return false;
    return EXTRA_SYMBOL_KINDS.some((kind) => getExtraSymbols(musicScore, kind).length > 0);
}

/**
 * 补齐规则字段缺省值（渲染与 dr-edit 创建共用）：
 * - note：vertical -0.5、horizontal 0；numberNotationAnchor 按 vertical 正负取 bottom / top
 * - slot：offset {vertical 0.5, horizontal 0}（小节底下方）
 * - measure：placement start、align left、type upper、vertical 0.1、horizontal 0
 */
export function normalizeExtraSymbol<K extends ExtraSymbolKind>(kind: K, input: ExtraSymbolInput<K>): ExtraSymbolMap[K] {
    if (kind === 'note') {
        const sym = input as ExtraSymbolInput<'note'>;
        const vertical = sym.vertical ?? -0.5;
        const out: ExtraNoteSymbol = {
            ...sym,
            vertical,
            horizontal: sym.horizontal ?? 0,
            numberNotationAnchor: sym.numberNotationAnchor ?? (vertical > 0 ? 'bottom' : 'top'),
        };
        return out as ExtraSymbolMap[K];
    }
    if (kind === 'slot') {
        const sym = input as ExtraSymbolInput<'slot'>;
        const out: ExtraSlotSymbol = {
            ...sym,
            offset: {vertical: sym.offset?.vertical ?? 0.5, horizontal: sym.offset?.horizontal ?? 0},
        };
        return out as ExtraSymbolMap[K];
    }
    const sym = input as ExtraSymbolInput<'measure'>;
    const out: ExtraMeasureSymbol = {
        ...sym,
        placement: sym.placement ?? 'start',
        align: sym.align ?? 'left',
        type: sym.type ?? 'upper',
        vertical: sym.vertical ?? 0.1,
        horizontal: sym.horizontal ?? 0,
    };
    return out as ExtraSymbolMap[K];
}

function toRule(kind: ExtraSymbolKind, input: ExtraSymbol): ExtraRuleMap[ExtraSymbolKind] {
    if (kind === 'note') {
        const s = normalizeExtraSymbol('note', input as ExtraNoteSymbol);
        return {
            kind: 'skin', skinKey: s.skinKey, vertical: s.vertical, horizontal: s.horizontal,
            numberNotationAnchor: s.numberNotationAnchor,
        };
    }
    if (kind === 'slot') {
        const s = normalizeExtraSymbol('slot', input as ExtraSlotSymbol);
        return {kind: 'skin', skinKey: s.skinKey, offset: s.offset};
    }
    const s = normalizeExtraSymbol('measure', input as ExtraMeasureSymbol);
    return {
        kind: 'skin', skinKey: s.skinKey, placement: s.placement, align: s.align, type: s.type,
        vertical: s.vertical, horizontal: s.horizontal,
    };
}

function toSkinItem(kind: ExtraSymbolKind, sym: ExtraSymbol): ExtraSkinItem {
    const item: ExtraSkinItem = {content: sym.content, w: sym.w, h: sym.h, skinKey: sym.skinKey};
    if (sym.widthRatio != null) item.widthRatio = sym.widthRatio;
    if (sym.widthRatioForMeasure != null) item.widthRatioForMeasure = sym.widthRatioForMeasure;
    item.extraKind = kind;
    item.extraRule = toRule(kind, sym);
    return item;
}

/** 自定义符号 → skinKey 对应的皮肤项（重复 skinKey 只取第一个，按 note / slot / measure 顺序） */
export function buildExtraSkinItems(musicScore: MusicScore): Record<string, ExtraSkinItem> {
    const items: Record<string, ExtraSkinItem> = {};
    for (const kind of EXTRA_SYMBOL_KINDS) {
        for (const sym of getExtraSymbols(musicScore, kind)) {
            if (sym?.skinKey && !(sym.skinKey in items)) items[sym.skinKey] = toSkinItem(kind, sym);
        }
    }
    return items;
}

export function notationPackKey(type: MusicScoreTypeEnum): keyof SkinPack {
    if (type === MusicScoreTypeEnum.NumberNotation) return 'numberNotation';
    if (type === MusicScoreTypeEnum.DrumNotation) return 'drumNotation';
    return tabSkinPackKeyForType(type) ?? 'standardStaff';
}

function withExtraItems(pack: SkinPack, type: MusicScoreTypeEnum, items: Record<string, ExtraSkinItem>): SkinPack {
    const key = notationPackKey(type);
    const base = (pack[key] ?? defaultSkin[key] ?? {}) as Record<string, SkinItem>;
    const merged: Record<string, SkinItem> = {...base};
    for (const [skinKey, item] of Object.entries(items)) {
        if (!(skinKey in base)) merged[skinKey] = item;
    }
    return {...pack, [key]: merged};
}

/** 每套皮肤包的当前谱种符号表都注入自定义符号；没有自定义符号时原样返回 */
export function withExtraSymbols(skin: Skin, musicScore: MusicScore | null | undefined): Skin {
    if (!musicScore || !hasExtraSymbols(musicScore)) return skin;
    const items = buildExtraSkinItems(musicScore);
    const out: Skin = {};
    for (const [name, pack] of Object.entries(skin)) out[name] = withExtraItemsAll(pack, items);
    if (!out.default) out.default = withExtraItemsAll(defaultSkin, items);
    return out;
}

const NOTATION_PACK_TYPES: MusicScoreTypeEnum[] = [
    MusicScoreTypeEnum.StandardStaff,
    MusicScoreTypeEnum.NumberNotation,
    MusicScoreTypeEnum.Guitar,
    MusicScoreTypeEnum.DrumNotation,
    MusicScoreTypeEnum.Ukulele,
    MusicScoreTypeEnum.Bass5,
    MusicScoreTypeEnum.Bass4,
    MusicScoreTypeEnum.Bass6,
];

/** 总谱里各单谱表谱种不同，自定义符号注入每一套谱种皮肤 */
function withExtraItemsAll(pack: SkinPack, items: Record<string, ExtraSkinItem>): SkinPack {
    let out = pack;
    for (const type of NOTATION_PACK_TYPES) out = withExtraItems(out, type, items);
    return out;
}

const BUILTIN_NAMES: Record<ExtraSymbolKind, ReadonlySet<string>> = {
    note: new Set(Object.values(SingleNoteAffiliatedSymbolNameEnum).map(String)),
    slot: new Set(Object.values(SingleSlotAffiliatedSymbolNameEnum).map(String)),
    measure: new Set(Object.values(SingleMeasureAffiliatedSymbolNameEnum).map(String)),
};

/**
 * 既不是内置符号名、也不在自定义符号里的 name（如被删掉的自定义符号仍被引用）：
 * 按该种类缺省规则定位，皮肤查不到由 Group 画 empty 占位。内置符号名没配规则的（未实现）仍静默跳过。
 */
export function unknownSymbolRuleOf<K extends ExtraSymbolKind>(kind: K, name: string): ExtraRuleMap[K] | undefined {
    if (!name || BUILTIN_NAMES[kind].has(name)) return undefined;
    return toRule(kind, {name, content: '', w: 0, h: 0, skinKey: name} as ExtraSymbol) as ExtraRuleMap[K];
}

/** 附属引擎用：从（已注入的）谱种皮肤表里取某种自定义符号的规则 */
export function extraRuleOf<K extends ExtraSymbolKind>(
    skin: Record<string, unknown> | undefined,
    kind: K,
    name: string,
): ExtraRuleMap[K] | undefined {
    const item = skin?.[name] as ExtraSkinItem | undefined;
    return item?.extraKind === kind ? item.extraRule as ExtraRuleMap[K] : undefined;
}
