import {Midi, NoteName, Octave} from "../../types";
import {AccidentalEnum, NoteLetterEnum} from "../../musicScoreEnum";

/*
* 手写
* */

// 变音符号优先级（可以调整顺序）
const prioritySharp: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Sharp,
    AccidentalEnum.Flat,

];
const priorityFlat: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Flat,
    AccidentalEnum.Sharp,
];

function midiToNoteName(midi: Midi, priority: AccidentalEnum.Sharp | AccidentalEnum.Flat = AccidentalEnum.Sharp): NoteName {


    const pitchIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const pitchMap = priority === AccidentalEnum.Sharp ?
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] :
        ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    const str = pitchMap[pitchIndex]

    return {
        letter: str[0] as NoteLetterEnum,
        accidental: (str[1] ?? '') as AccidentalEnum.Sharp | AccidentalEnum.Flat | AccidentalEnum.None,
        octave
    };
}

export default midiToNoteName;

// console.log(midiToNoteName(57));
//
// console.log(midiToNoteName(61));
