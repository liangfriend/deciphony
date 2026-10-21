/**
 * 单宿主附属（内置或曲谱自定义符号）：按 id 定位、改 Frame、删除。
 * - note：五线 / tab / 鼓谱挂在 NotesInfo（含前后倚音），简谱音符 / 休止符挂在 slot.symbol 自身
 * - slot：MeasureNoteSlot.affiliatedSymbols
 * - measure：Measure.affiliatedSymbols
 */
import {getMeasureSlots} from '@deciphony/renderer';
import type {Frame, GrandStaff, Measure, MeasureNoteSlot, MusicScore, SingleStaff} from '@deciphony/renderer';
import type {
    FramePartial,
    LocatedSingleAffiliatedSymbol,
    SingleAffiliatedSymbolKind,
    SingleAffiliatedSymbolMap,
} from './types';

export type SingleAffiliatedListContext = {
    grandStaffIndex: number;
    singleStaffIndex: number;
    measureIndex: number;
    grandStaff: GrandStaff;
    singleStaff: SingleStaff;
    measure: Measure;
    slot: MeasureNoteSlot | null;
    host: object;
};

/**
 * 遍历曲谱里所有单宿主附属数组（只给出已存在的数组）。visit 返回 true 时停止遍历。
 */
export function forEachSingleAffiliatedList(
    score: MusicScore,
    visit: <K extends SingleAffiliatedSymbolKind>(
        kind: K,
        list: SingleAffiliatedSymbolMap[K][],
        ctx: SingleAffiliatedListContext,
    ) => boolean | void,
): void {
    const grandStaffs = score.grandStaffs ?? [];
    for (let grandStaffIndex = 0; grandStaffIndex < grandStaffs.length; grandStaffIndex++) {
        const grandStaff = grandStaffs[grandStaffIndex]!;
        const staves = grandStaff.staves ?? [];
        for (let singleStaffIndex = 0; singleStaffIndex < staves.length; singleStaffIndex++) {
            const singleStaff = staves[singleStaffIndex]!;
            const measures = singleStaff.measures ?? [];
            for (let measureIndex = 0; measureIndex < measures.length; measureIndex++) {
                const measure = measures[measureIndex]!;
                const base = {grandStaffIndex, singleStaffIndex, measureIndex, grandStaff, singleStaff, measure};
                const emit = <K extends SingleAffiliatedSymbolKind>(
                    kind: K,
                    host: unknown,
                    slot: MeasureNoteSlot | null,
                ): boolean => {
                    const list = (host as {affiliatedSymbols?: unknown} | null)?.affiliatedSymbols;
                    if (!Array.isArray(list)) return false;
                    return visit(kind, list as SingleAffiliatedSymbolMap[K][], {...base, slot, host: host as object}) === true;
                };
                if (emit('measure', measure, null)) return;
                for (const slot of getMeasureSlots(measure)) {
                    if (emit('slot', slot, slot)) return;
                    const body = slot.symbol as {notesInfo?: unknown; graceNotes?: unknown; graceNotesAfter?: unknown} | null;
                    if (!body) continue;
                    if (emit('note', body, slot)) return;
                    for (const infos of [body.notesInfo, body.graceNotes, body.graceNotesAfter]) {
                        if (!Array.isArray(infos)) continue;
                        for (const info of infos) {
                            if (emit('note', info, slot)) return;
                        }
                    }
                }
            }
        }
    }
}

/** 按 id 找单宿主附属（音符 / slot / 小节三种，含倚音上的、自定义符号） */
export function locateSingleAffiliatedSymbolById(
    score: MusicScore,
    symbolId: string,
): LocatedSingleAffiliatedSymbol | null {
    let found: LocatedSingleAffiliatedSymbol | null = null;
    forEachSingleAffiliatedList(score, (kind, list, ctx) => {
        const index = list.findIndex((sym) => sym.id === symbolId);
        if (index < 0) return false;
        found = {...ctx, kind, list, index, symbol: list[index]!} as LocatedSingleAffiliatedSymbol;
        return true;
    });
    return found;
}

const FRAME_KEYS = ['relativeX', 'relativeY', 'relativeW', 'relativeH'] as const;

/**
 * 改单宿主附属自身的 Frame（相对规则定位的偏移，排版时叠加）；只写传入的有限数值。
 * 找不到返回 null。
 */
export function setSingleAffiliatedSymbolFrame(
    score: MusicScore,
    symbolId: string,
    frame: FramePartial,
): LocatedSingleAffiliatedSymbol | null {
    const located = locateSingleAffiliatedSymbolById(score, symbolId);
    if (!located) return null;
    const target = located.symbol as Frame;
    for (const key of FRAME_KEYS) {
        const v = frame[key];
        if (typeof v === 'number' && Number.isFinite(v)) target[key] = v;
    }
    return located;
}

/** 删单宿主附属；不存在返回 false */
export function removeSingleAffiliatedSymbolById(score: MusicScore, symbolId: string): boolean {
    const located = locateSingleAffiliatedSymbolById(score, symbolId);
    if (!located) return false;
    located.list.splice(located.index, 1);
    return true;
}
