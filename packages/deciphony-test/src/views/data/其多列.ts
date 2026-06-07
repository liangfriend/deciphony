import {
    BarlineTypeEnum,
    BeamTypeEnum,
    BracketTypeEnum,
    ClefTypeEnum,
    KeySignatureTypeEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    MeasureEndRepeatEnum,
    MeasureStartRepeatEnum,
    MusicScore,
    TimeSignatureTypeEnum
} from "deciphony-renderer";
import {
    createBarline,
    createClef,
    createEmptyMeasure,
    createGrandStaff,
    createKeySignature,
    createMusicScore,
    createNoteRest,
    createNoteSymbol,
    createSingleStaff,
    createTimeSignature,
} from "./scoreBuilder";
// 曲谱结构

const data: MusicScore = createMusicScore({height: 800, width: 800})
for (let i = 0; i < 2; i++) {
    // 复谱表1-单谱表1
    const grandStaff1 = createGrandStaff()
    grandStaff1.linkedStaff = true
    grandStaff1.bracket = {
        id: crypto.randomUUID(),
        type: BracketTypeEnum.Brace,
        startSingleStaffIndex: 0
    }
    const measure12 = createEmptyMeasure()
    const measure13 = createEmptyMeasure()
    const measure14 = createEmptyMeasure()
    grandStaff1.staves[0].measures.push(measure12)
    grandStaff1.staves[0].measures.push(measure13)
    grandStaff1.staves[0].measures.push(measure14)
    // 复谱表1-单谱表2
    const singleStaff2 = createSingleStaff()
    const measure22 = createEmptyMeasure()
    const measure23 = createEmptyMeasure()
    const measure24 = createEmptyMeasure()
    singleStaff2.measures.push(measure22)
    singleStaff2.measures.push(measure23)
    singleStaff2.measures.push(measure24)
    grandStaff1.staves.push(singleStaff2)
    data.grandStaffs.push(grandStaff1)
}
/*
* 其多列曲谱
* 复谱表1 高低音谱号F调2/4拍
* |32:5 32:3 64:3|32:5 32:3 32:3| 32:-1 32:-1 32:1 32:3| 32:2 32:1 32:2|
* |64:8 64:10|64:8 64:10|64:rest 32:8 32:6|128:10|
* 复谱表2 高低音谱号F调2/4拍
* |32:3 32:5 32:3 32:2| 32:1 32:2 64：-1|32:1 32：-1 32：-1|32:1 32：-1 64:-1|
* |32:rest 32:8 64:10|64:8 (64:9 64:7)| 64:rest (32:8 32:7) 32:4|64:rest (32:8 32:6) 32:4
*
* */

// 小节1-符号 高音谱号 F调 2/4拍
const measure1 = data.grandStaffs[0].staves[0].measures[0]
const keySignature1 = createKeySignature(KeySignatureTypeEnum.F)
const timeSignature1 = createTimeSignature(TimeSignatureTypeEnum['2_4'])
const noteSymbol11 = createNoteSymbol({region: 5, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol12 = createNoteSymbol({region: 3, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol13 = createNoteSymbol({region: 3, chronaxie: 64, direction: 'up', beamType: BeamTypeEnum.None,})
measure1.keySignature_f = keySignature1
measure1.timeSignature_f = timeSignature1
measure1.notes.push(noteSymbol11)
measure1.notes.push(noteSymbol12)
measure1.notes.push(noteSymbol13)

// 小节2-符号 高音 |32:5 32:3 32:3|
const measure3 = data.grandStaffs[0].staves[0].measures[1]
const noteSymbol31 = createNoteSymbol({region: 5, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol32 = createNoteSymbol({region: 3, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol33 = createNoteSymbol({region: 3, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
measure3.startRepeat = {
    id: crypto.randomUUID(),
    type: MeasureStartRepeatEnum.Segno,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
}
measure3.notes.push(noteSymbol31)
measure3.notes.push(noteSymbol32)
measure3.notes.push(noteSymbol33)

// 复谱表1-单谱表1-小节2：前两个音符连音线（端点为 notesInfo.id）
data.affiliatedSymbols.push({
    id: crypto.randomUUID(),
    name: DoubleNoteAffiliatedSymbolNameEnum.Slur,
    startId: noteSymbol32.notesInfo[0]!.id,
    endId: noteSymbol33.notesInfo[0]!.id,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
    data: {
        slur: {
            relativeStartPoint: {x: 0, y: 0},
            relativeEndPoint: {x: 0, y: 0},
            relativeControlPoint: {x: 0, y: 0},
            thickness: 2,
        },
    },
})

// 小节3-符号 高音 |32:-1 32:-1 32:1 32:1 32:3|
const measure4 = data.grandStaffs[0].staves[0].measures[2]
const noteSymbol41 = createNoteSymbol({region: -1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol42 = createNoteSymbol({region: -1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol44 = createNoteSymbol({region: 1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol45 = createNoteSymbol({region: 3, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
measure4.notes.push(noteSymbol41)
measure4.notes.push(noteSymbol42)
measure4.notes.push(noteSymbol44)
measure4.notes.push(noteSymbol45)

// 小节4-符号 高音 |32:2 32:1 32:2|
const measure5 = data.grandStaffs[0].staves[0].measures[3]
const noteSymbol51 = createNoteSymbol({region: 2, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol52 = createNoteSymbol({region: 1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol53 = createNoteSymbol({region: 2, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
measure5.notes.push(noteSymbol51)
measure5.notes.push(noteSymbol52)
measure5.notes.push(noteSymbol53)

// 小节1-符号 低音谱号 F调 2/4拍 |64:8 64:10|
const measure2 = data.grandStaffs[0].staves[1].measures[0]
const clef2 = createClef(ClefTypeEnum.Bass)
const keySignature2 = createKeySignature(KeySignatureTypeEnum.F)
const timeSignature2 = createTimeSignature(TimeSignatureTypeEnum['2_4'])
const noteSymbol21 = createNoteSymbol({region: 8, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None,})
const noteSymbol22 = createNoteSymbol({region: 10, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None,})
measure2.clef_f = clef2
measure2.keySignature_f = keySignature2
measure2.timeSignature_f = timeSignature2
measure2.notes.push(noteSymbol21)
measure2.notes.push(noteSymbol22)

// 小节2-符号 低音 |64:8 64:10|
const measure6 = data.grandStaffs[0].staves[1].measures[1]
const noteSymbol61 = createNoteSymbol({region: 8, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None,})
const noteSymbol62 = createNoteSymbol({region: 10, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None,})
measure6.notes.push(noteSymbol61)
measure6.notes.push(noteSymbol62)

// 小节3-符号 低音 |64:rest 32:8 32:6|
const measure7 = data.grandStaffs[0].staves[1].measures[2]
const noteRest71 = createNoteRest({chronaxie: 64})
const noteSymbol72 = createNoteSymbol({region: 8, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol73 = createNoteSymbol({region: 6, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
measure7.notes.push(noteRest71)
measure7.notes.push(noteSymbol72)
measure7.notes.push(noteSymbol73)

// 小节4-符号 低音 |128:10|
const measure8 = data.grandStaffs[0].staves[1].measures[3]
const noteSymbol81 = createNoteSymbol({region: 10, chronaxie: 128, direction: 'down', beamType: BeamTypeEnum.None,})
measure8.notes.push(noteSymbol81)

// 复谱表2 小节1-符号 高音谱号 F调 2/4拍 |32:3 32:5 32:3 32:2|
const measure9 = data.grandStaffs[1].staves[0].measures[0]
const keySignature9 = createKeySignature(KeySignatureTypeEnum.F)
const timeSignature9 = createTimeSignature(TimeSignatureTypeEnum['2_4'])
const noteSymbol91 = createNoteSymbol({region: 3, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol92 = createNoteSymbol({region: 5, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol93 = createNoteSymbol({region: 3, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
const noteSymbol94 = createNoteSymbol({region: 2, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
measure9.keySignature_f = keySignature9
measure9.timeSignature_f = timeSignature9
measure9.notes.push(noteSymbol91)
measure9.notes.push(noteSymbol92)
measure9.notes.push(noteSymbol93)
measure9.notes.push(noteSymbol94)

// 复谱表2 小节2-符号 高音 |32:1 32:2 64:-1|
const measure10 = data.grandStaffs[1].staves[0].measures[1]
const noteSymbol10_1 = createNoteSymbol({region: 1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol10_2 = createNoteSymbol({region: 2, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol10_3 = createNoteSymbol({region: -1, chronaxie: 64, direction: 'up', beamType: BeamTypeEnum.None,})
measure10.notes.push(noteSymbol10_1)
measure10.notes.push(noteSymbol10_2)
measure10.notes.push(noteSymbol10_3)

// 复谱表2 小节3-符号 高音 |32:1 32:-1 32:-1|
const measure11 = data.grandStaffs[1].staves[0].measures[2]
const noteSymbol11_1 = createNoteSymbol({region: 1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol11_2 = createNoteSymbol({region: -1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol11_3 = createNoteSymbol({region: -1, chronaxie: 64, direction: 'up', beamType: BeamTypeEnum.Combined,})
measure11.notes.push(noteSymbol11_1)
measure11.notes.push(noteSymbol11_2)
measure11.notes.push(noteSymbol11_3)

// 复谱表2 小节4-符号 高音 |32:1 32:-1 64:-1|
const measure12_ = data.grandStaffs[1].staves[0].measures[3]
const barline12 = createBarline(BarlineTypeEnum.EndRepeat_barline)
const noteSymbol12_1 = createNoteSymbol({region: 1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol12_2 = createNoteSymbol({region: -1, chronaxie: 32, direction: 'up', beamType: BeamTypeEnum.Combined,})
const noteSymbol12_3 = createNoteSymbol({region: -1, chronaxie: 64, direction: 'up', beamType: BeamTypeEnum.None,})
measure12_.barline_b = barline12
measure9.endRepeat = {
    id: crypto.randomUUID(),
    type: MeasureEndRepeatEnum.DS,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
}
measure12_.notes.push(noteSymbol12_1)
measure12_.notes.push(noteSymbol12_2)
measure12_.notes.push(noteSymbol12_3)

// 复谱表2 小节1-符号 低音谱号 F调 2/4拍 |32:rest 32:8 64:10|
const measure13_ = data.grandStaffs[1].staves[1].measures[0]

const clef13 = createClef(ClefTypeEnum.Bass)
const keySignature13 = createKeySignature(KeySignatureTypeEnum.F)
const timeSignature13 = createTimeSignature(TimeSignatureTypeEnum['2_4'])
const noteRest13_1 = createNoteRest({chronaxie: 32})
const noteSymbol13_2 = createNoteSymbol({region: 8, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.None,})
const noteSymbol13_3 = createNoteSymbol({region: 10, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None,})
measure13_.clef_f = clef13
measure13_.keySignature_f = keySignature13
measure13_.timeSignature_f = timeSignature13
measure13_.notes.push(noteRest13_1)
measure13_.notes.push(noteSymbol13_2)
measure13_.notes.push(noteSymbol13_3)

// 复谱表2 小节2-符号 低音 |64:8 (64:9 64:7)|
const measure14_ = data.grandStaffs[1].staves[1].measures[1]
const noteSymbol14_1 = createNoteSymbol({region: 8, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None,})
const noteSymbol14_2 = createNoteSymbol({
    notesInfo: [
        {region: 9, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None},
        {region: 7, chronaxie: 64, direction: 'down', beamType: BeamTypeEnum.None},
    ]
})
measure14_.notes.push(noteSymbol14_1)
measure14_.notes.push(noteSymbol14_2)

// 复谱表2 小节3-符号 低音 |64:rest (32:8 32:7) 32:4|
const measure15_ = data.grandStaffs[1].staves[1].measures[2]

const noteRest15_1 = createNoteRest({chronaxie: 64})
const noteSymbol15_2 = createNoteSymbol({
    notesInfo: [
        {region: 8, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined},
        {region: 7, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined},
    ]
})
const noteSymbol15_3 = createNoteSymbol({region: 4, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})

measure15_.notes.push(noteRest15_1)
measure15_.notes.push(noteSymbol15_2)
measure15_.notes.push(noteSymbol15_3)

// 复谱表2 小节4-符号 低音 |64:rest (32:8 32:6) 32:4|
const measure16_ = data.grandStaffs[1].staves[1].measures[3]
const barline2 = createBarline(BarlineTypeEnum.EndRepeat_barline)
const noteRest16_1 = createNoteRest({chronaxie: 64})
const noteSymbol16_2 = createNoteSymbol({
    notesInfo: [
        {region: 8, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined},
        {region: 6, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined},
    ]
})
const noteSymbol16_3 = createNoteSymbol({region: 4, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
measure16_.barline_b = barline2
measure16_.notes.push(noteRest16_1)
measure16_.notes.push(noteSymbol16_2)
measure16_.notes.push(noteSymbol16_3)

// data.grandStaffs[0].staves.splice(1, 1)
export default data
