// 把字母转成 0~6
import {AccidentalEnum, ClefEnum, NoteLetterEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";
import {NoteName, StaffRegion} from "../../types";

// 变音符号优先级（可以调整顺序）
const accidentalPriority: AccidentalEnum[] = [AccidentalEnum.Natural, AccidentalEnum.Sharp, AccidentalEnum.Flat, AccidentalEnum.DoubleSharp, AccidentalEnum.DoubleFlat,];

function letterToIndex(letter: NoteLetterEnum): number {
    switch (letter) {
        case NoteLetterEnum.C:
            return 0;
        case NoteLetterEnum.D:
            return 1;
        case NoteLetterEnum.E:
            return 2;
        case NoteLetterEnum.F:
            return 3;
        case NoteLetterEnum.G:
            return 4;
        case NoteLetterEnum.A:
            return 5;
        case NoteLetterEnum.B:
            return 6;
    }
}


// 每个谱号的「基准音」对应的五线谱行 (lineIndex = 第几线)
interface ClefBase {
    letter: NoteLetterEnum; // 基准音名
    octave: number;         // 基准八度
    lineIndex: number;      // 落在哪条线 (main region)
}

const clefBaseMap: Record<ClefEnum, ClefBase> = {
    [ClefEnum.Treble]: {letter: NoteLetterEnum.G, octave: 4, lineIndex: 2}, // G4 第二线
    [ClefEnum.MezzoSoprano]: {letter: NoteLetterEnum.C, octave: 4, lineIndex: 2}, // C4 第二线
    [ClefEnum.Alto]: {letter: NoteLetterEnum.C, octave: 4, lineIndex: 3}, // C4 第三线
    [ClefEnum.Tenor]: {letter: NoteLetterEnum.C, octave: 4, lineIndex: 4}, // C4 第四线
    [ClefEnum.BaritoneF]: {letter: NoteLetterEnum.F, octave: 3, lineIndex: 3}, // F3 第三线
    [ClefEnum.BaritoneC]: {letter: NoteLetterEnum.C, octave: 4, lineIndex: 5}, // C4 第五线
    [ClefEnum.Bass]: {letter: NoteLetterEnum.F, octave: 3, lineIndex: 4}, // F3 第四线
    [ClefEnum.Subbass]: {letter: NoteLetterEnum.F, octave: 2, lineIndex: 5}, // F2 第五线
};

// 主函数
function noteNameToRegion(noteName: NoteName, clef: ClefEnum): {
    staffRegion: StaffRegion,
    accidental: AccidentalEnum
} {
    // 1) 取谱号基准
    const base = clefBaseMap[clef];

    // 2) 计算严格的字母级数差（不看升降）
    const noteLetterIdx = letterToIndex(noteName.letter);
    const baseLetterIdx = letterToIndex(base.letter);
    const diatonicSteps = (noteLetterIdx - baseLetterIdx) + (noteName.octave - base.octave) * 7;

    // 3) 把“第几线”换算成 step：line1=0, space1=1, line2=2, ..., line5=8
    const baseStep = (base.lineIndex - 1) * 2;

    // 4) 目标 step（线/间统一计数）
    const step = baseStep + diatonicSteps;

    // 5) 判定 line / space（偶数为线，奇数为间）
    const isLine = (step % 2 === 0);
    const type = isLine ? StaffPositionTypeEnum.Line : StaffPositionTypeEnum.Space;

    // 6) 判定区域与 index
    let region: StaffRegionEnum;
    let index: number;

    if (step < 0) {
        // Lower：距离底线的步数
        region = StaffRegionEnum.Lower;
        const delta = -step;                // 1=下加一间, 2=下加一线, 3=下加二间, ...
        index = Math.ceil(delta / 2);       // 1,1,2,2,3,3,...
    } else if (step > 8) {
        // Upper：距离顶线的步数
        region = StaffRegionEnum.Upper;
        const delta = step - 8;             // 1=上加一间, 2=上加一线, ...
        index = Math.ceil(delta / 2);       // 1,1,2,2,3,3,...
    } else {
        // Main：五线谱本体
        region = StaffRegionEnum.Main;
        if (isLine) {
            // line step: 0,2,4,6,8 -> line1..line5
            index = (step / 2) + 1;
        } else {
            // space step: 1,3,5,7 -> space1..space4
            index = (step + 1) / 2;
        }
    }

    // 7) 按优先级选择变音（此处等于沿用入参的变音）
    const accidental = accidentalPriority.find(a => a === noteName.accidental) ?? AccidentalEnum.Natural;

    return {
        staffRegion: {region, type, index},
        accidental
    };
}

export default noteNameToRegion;

function testNoteNameToRegion() {
    const testNotes: NoteName[] = [
        {letter: NoteLetterEnum.C, accidental: AccidentalEnum.Natural, octave: 4},  // C4
        {letter: NoteLetterEnum.F, accidental: AccidentalEnum.Sharp, octave: 4},  // F#4
        {letter: NoteLetterEnum.B, accidental: AccidentalEnum.Flat, octave: 3},  // Bb3
        {letter: NoteLetterEnum.G, accidental: AccidentalEnum.Natural, octave: 5},  // G5
        {letter: NoteLetterEnum.A, accidental: AccidentalEnum.DoubleFlat, octave: 2}, // Abb2
    ];

    const clefs: ClefEnum[] = [
        ClefEnum.Treble,
        ClefEnum.Alto,
        ClefEnum.Bass
    ];

    for (const clef of clefs) {
        console.log(`\n=== Clef: ${ClefEnum[clef]} ===`);
        for (const note of testNotes) {
            const result = noteNameToRegion(note, clef);
            console.log(
                `${note.letter}${note.accidental}${note.octave} → region=${result.staffRegion.region}, type=${result.staffRegion.type}, index=${result.staffRegion.index}, accidental=${result.accidental}`
            );
        }
    }
}

// testNoteNameToRegion()