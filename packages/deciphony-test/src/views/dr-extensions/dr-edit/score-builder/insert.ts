import {ClefTypeEnum, MusicScoreTypeEnum, TimeSignatureTypeEnum} from 'deciphony-renderer';
import type {GrandStaff, Measure, MusicScore, SingleStaff} from 'deciphony-renderer';
import {assertIndex} from './id';
import {
    createGrandStaff,
    createMeasure,
    createSingleStaff,
    cloneMeasureHeaderFromPrev,
} from './factories';

/** 在曲谱指定下标插入复谱表 */
export function insertGrandStaff(score: MusicScore, at: number): GrandStaff {
    assertIndex('grandStaffIndex', at, score.grandStaffs.length + 1);
    const staff = createGrandStaff({notationType: score.type});
    score.grandStaffs.splice(at, 0, staff);
    return staff;
}

/** 在复谱表指定下标插入单谱表 */
export function insertSingleStaff(
    grandStaff: GrandStaff,
    at: number,
    options?: {notationType?: MusicScoreTypeEnum},
): SingleStaff {
    assertIndex('singleStaffIndex', at, grandStaff.staves.length + 1);
    const singleStaff = createSingleStaff({notationType: options?.notationType});
    grandStaff.staves.splice(at, 0, singleStaff);
    return singleStaff;
}

function newMeasureForInsert(
    singleStaff: SingleStaff,
    at: number,
    notationType?: MusicScoreTypeEnum,
): Measure {
    const prev = at > 0 ? singleStaff.measures[at - 1] : singleStaff.measures[singleStaff.measures.length - 1];
    if (prev) {
        const header = cloneMeasureHeaderFromPrev(prev);
        return createMeasure({
            clef: header.clef_f?.type,
            timeSignature: header.timeSignature_f?.type,
            keySignature: header.keySignature_f?.type,
        });
    }
    const isNumberNotation = notationType === MusicScoreTypeEnum.NumberNotation;
    return createMeasure(
        isNumberNotation
            ? {timeSignature: TimeSignatureTypeEnum['4_4']}
            : {clef: ClefTypeEnum.Treble, timeSignature: TimeSignatureTypeEnum['4_4']},
    );
}

/** 在单谱表指定下标插入小节 */
export function insertMeasure(
    singleStaff: SingleStaff,
    at: number,
    options?: {notationType?: MusicScoreTypeEnum},
): Measure {
    assertIndex('measureIndex', at, singleStaff.measures.length + 1);
    const measure = newMeasureForInsert(singleStaff, at, options?.notationType);
    singleStaff.measures.splice(at, 0, measure);
    return measure;
}
