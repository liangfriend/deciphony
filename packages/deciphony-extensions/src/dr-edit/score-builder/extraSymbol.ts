/**
 * 曲谱自定义符号（MusicScore.extraNoteSymbol / extraSlotSymbol / extraMeasureSymbol）的增删改。
 * 三种自定义符号一套 API，第二个参数 kind = 'note' | 'slot' | 'measure'。
 *
 * 引用：附属符号 name 填 skinKey
 * - note → createSingleNoteAffiliatedSymbol(skinKey)，放音符 / 休止符的 affiliatedSymbols
 * - slot → createSingleSlotAffiliatedSymbol(skinKey)，放 MeasureNoteSlot.affiliatedSymbols
 * - measure → createSingleMeasureAffiliatedSymbol(skinKey)，放 Measure.affiliatedSymbols
 *
 * skinKey 规则：非空、首尾无空白；在三个数组里唯一；不能与内置单音符 / 单 slot / 单小节符号名、默认皮肤任一谱种的皮肤键重名。
 */
import {
    EXTRA_SYMBOL_FIELDS,
    EXTRA_SYMBOL_KINDS,
    SingleMeasureAffiliatedSymbolNameEnum,
    SingleNoteAffiliatedSymbolNameEnum,
    SingleSlotAffiliatedSymbolNameEnum,
    defaultSkin,
    getExtraSymbols,
    normalizeExtraSymbol,
} from '@deciphony/renderer';
import {forEachSingleAffiliatedList} from './singleAffiliated';
import type {
    ExtraSymbol,
    ExtraSymbolInput,
    ExtraSymbolKind,
    ExtraSymbolMap,
    MusicScore,
} from '@deciphony/renderer';
import type {SingleAffiliatedSymbolMap} from './types';

/** 种类 → 引用它的附属符号类型 */
export type ExtraSymbolUsageMap = SingleAffiliatedSymbolMap;

export type LocatedExtraSymbol<K extends ExtraSymbolKind = ExtraSymbolKind> = {
    [P in K]: {kind: P; symbol: ExtraSymbolMap[P]; index: number}
}[K];

/** 引用自定义符号的附属符号及其所在数组（宿主的 affiliatedSymbols） */
export type ExtraSymbolUsage<K extends ExtraSymbolKind = ExtraSymbolKind> = {
    [P in K]: {kind: P; symbol: ExtraSymbolUsageMap[P]; host: ExtraSymbolUsageMap[P][]}
}[K];

const KIND_LABEL: Record<ExtraSymbolKind, string> = {note: '音符', slot: 'slot', measure: '小节'};

/** 新建自定义符号（补齐规则缺省值，不写入曲谱） */
export function createExtraSymbol<K extends ExtraSymbolKind>(kind: K, input: ExtraSymbolInput<K>): ExtraSymbolMap[K] {
    return normalizeExtraSymbol(kind, input);
}

/** 旧曲谱补上三个空数组 */
export function ensureExtraSymbols(score: MusicScore): void {
    for (const kind of EXTRA_SYMBOL_KINDS) score[EXTRA_SYMBOL_FIELDS[kind]] ??= [];
}

function extraList<K extends ExtraSymbolKind>(score: MusicScore, kind: K): ExtraSymbolMap[K][] {
    ensureExtraSymbols(score);
    return score[EXTRA_SYMBOL_FIELDS[kind]] as ExtraSymbolMap[K][];
}

let builtinKeys: Set<string> | null = null;

/** 内置单音符 / 单 slot / 单小节符号名 + 默认皮肤所有谱种的皮肤键 */
export function isBuiltinSymbolKey(skinKey: string): boolean {
    if (!builtinKeys) {
        builtinKeys = new Set<string>([
            ...Object.values(SingleNoteAffiliatedSymbolNameEnum),
            ...Object.values(SingleSlotAffiliatedSymbolNameEnum),
            ...Object.values(SingleMeasureAffiliatedSymbolNameEnum),
        ].map(String));
        for (const pack of Object.values(defaultSkin)) {
            for (const key of Object.keys(pack ?? {})) builtinKeys.add(key);
        }
    }
    return builtinKeys.has(skinKey);
}

export function findExtraSymbol(score: MusicScore, skinKey: string): LocatedExtraSymbol | null {
    for (const kind of EXTRA_SYMBOL_KINDS) {
        const list = getExtraSymbols(score, kind);
        const index = list.findIndex((s) => s.skinKey === skinKey);
        if (index >= 0) return {kind, symbol: list[index]!, index} as LocatedExtraSymbol;
    }
    return null;
}

/** 校验 skinKey；合法返回 null，否则返回原因。ignore = 正在修改的那个符号自己 */
export function validateExtraSkinKey(score: MusicScore, skinKey: string, ignore?: ExtraSymbol): string | null {
    if (typeof skinKey !== 'string' || !skinKey.trim()) return 'skinKey 不能为空';
    if (skinKey !== skinKey.trim()) return 'skinKey 首尾不能有空白';
    if (isBuiltinSymbolKey(skinKey)) return `skinKey「${skinKey}」与内置符号重名`;
    const found = findExtraSymbol(score, skinKey);
    if (found && found.symbol !== ignore) return `skinKey「${skinKey}」已存在`;
    return null;
}

function assertValid(score: MusicScore, sym: ExtraSymbol, ignore?: ExtraSymbol): void {
    const reason = validateExtraSkinKey(score, sym.skinKey, ignore);
    if (reason) throw new Error(reason);
    if (typeof sym.name !== 'string') throw new Error('自定义符号 name 必须是字符串');
    if (typeof sym.content !== 'string' || !sym.content.trim()) throw new Error('自定义符号 content 不能为空');
    for (const k of ['w', 'h'] as const) {
        const v = sym[k];
        if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw new Error(`自定义符号 ${k} 必须是正数`);
    }
}

/** 加一个自定义符号到曲谱，返回写入的对象；skinKey / 皮肤字段不合法时抛错 */
export function addExtraSymbol<K extends ExtraSymbolKind>(score: MusicScore, kind: K, input: ExtraSymbolInput<K>): ExtraSymbolMap[K] {
    const sym = createExtraSymbol(kind, input);
    assertValid(score, sym);
    extraList(score, kind).push(sym);
    return sym;
}

/** 曲谱里引用该自定义符号的所有附属符号 */
export function findExtraSymbolUsages(score: MusicScore, skinKey: string): ExtraSymbolUsage[] {
    const found = findExtraSymbol(score, skinKey);
    if (!found) return [];
    const out: ExtraSymbolUsage[] = [];
    forEachSingleAffiliatedList(score, (kind, host) => {
        if (kind !== found.kind) return;
        for (const symbol of host) {
            if (symbol.name === skinKey) out.push({kind, symbol, host} as ExtraSymbolUsage);
        }
    });
    return out;
}

function locate<K extends ExtraSymbolKind>(score: MusicScore, kind: K, skinKey: string): LocatedExtraSymbol<K> {
    const found = findExtraSymbol(score, skinKey);
    if (!found || found.kind !== kind) throw new Error(`自定义${KIND_LABEL[kind]}符号「${skinKey}」不存在`);
    return found as LocatedExtraSymbol<K>;
}

/** 原地修改自定义符号；改 skinKey 时曲谱里引用它的附属符号一起改名 */
export function updateExtraSymbol<K extends ExtraSymbolKind>(
    score: MusicScore,
    kind: K,
    skinKey: string,
    patch: Partial<ExtraSymbolMap[K]>,
): ExtraSymbolMap[K] {
    const target = locate(score, kind, skinKey).symbol as ExtraSymbolMap[K];
    const next = {...target, ...patch} as ExtraSymbolMap[K];
    assertValid(score, next, target);
    const usages = next.skinKey !== skinKey ? findExtraSymbolUsages(score, skinKey) : [];
    Object.assign(target, patch);
    for (const u of usages) u.symbol.name = next.skinKey;
    return target;
}

/** 删自定义符号；被引用时默认拒绝（抛错），removeUsages: true 连引用一起删。不存在返回 false */
export function removeExtraSymbol(
    score: MusicScore,
    kind: ExtraSymbolKind,
    skinKey: string,
    options?: {removeUsages?: boolean},
): boolean {
    const found = findExtraSymbol(score, skinKey);
    if (!found || found.kind !== kind) return false;
    const usages = findExtraSymbolUsages(score, skinKey);
    if (usages.length && !options?.removeUsages) {
        throw new Error(`自定义符号「${skinKey}」被 ${usages.length} 处使用，传 removeUsages: true 一并删除`);
    }
    for (const u of usages) {
        const host = u.host as unknown[];
        const i = host.indexOf(u.symbol);
        if (i >= 0) host.splice(i, 1);
    }
    extraList(score, kind).splice(found.index, 1);
    return true;
}
