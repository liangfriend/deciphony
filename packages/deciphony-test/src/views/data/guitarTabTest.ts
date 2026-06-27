import {
    AugmentationDot,
    BeamTypeEnum, BendTypeEnum, Chronaxie,
    DoubleNoteAffiliatedSymbolNameEnum,
    Frame,
    MusicScore,
    MusicScoreTypeEnum,
    NoteName,
    NoteSymbolTypeEnum, SingleNoteAffiliatedSymbol, SlurTypeEnum, TabNote,
    TabNoteInfo,
    TabNoteInfoTypeEnum,
} from "deciphony-renderer";
import {createGrandStaff, createMusicScore,} from "./scoreBuilder";
// 曲谱结构

const data: MusicScore = createMusicScore({height: 800, width: 800, type: MusicScoreTypeEnum.GuitarTab})
// 复谱表1-单谱表1
const grandStaff1 = createGrandStaff()

data.grandStaffs.push(grandStaff1)

const noteInfoId1 = Date.now() + 5
const noteInfoId2 = Date.now() + 7
const noteInfoId3 = Date.now() + 10
const noteInfoId4 = Date.now() + 11
const noteSlapId1 = Date.now() + 30
const noteSlapId2 = Date.now() + 31
const noteSlapId3 = Date.now() + 32

const emptyChord: TabNote['chord'] = {
    id: Date.now() + 99,
    width: 50,
    height: 60,
    stringCount: 6,
    name: '',
    fretCount: 5,
    baseFret: 0,
    barres: [],
    tuning: [NoteName.E, NoteName.A, NoteName.D, NoteName.G, NoteName.B, NoteName.E],
    stringStates: [],
    relativeX: 0,
    relativeY: 0,
    relativeW: 1,
    relativeH: 1,
}

const note: TabNote = {

    id: Date.now(),

    type: NoteSymbolTypeEnum.Note,

    notesInfo: [{
        id: noteInfoId1,
        type: TabNoteInfoTypeEnum.Harmonic,
        chronaxie: 8,
        region: 0, // 这个含义是第几条线， 0是第一线，1是第二线...

        value: 21, // 品，-1代表x

        beamType: BeamTypeEnum.Combined,
        augmentationDot: {
            id: Date.now(),
            count: 3
        },

        affiliatedSymbols: []
    }, {
        id: noteInfoId2,
        type: TabNoteInfoTypeEnum.Harmonic,
        chronaxie: 128,
        region: 2, // 这个含义是第几条线， 0是第一线，1是第二线...

        value: 6, // 品，-1代表x

        beamType: BeamTypeEnum.None,

        affiliatedSymbols: []
    }],

    chord: {
        id: Date.now() + 20,
        width: 50,
        height: 60,
        stringCount: 6,
        name: 'C',
        fretCount: 5,
        baseFret: 0,
        textSize: 10,
        nameSize: 32,
        barres: [],
        tuning: [NoteName.E, NoteName.A, NoteName.D, NoteName.G, NoteName.B, NoteName.E],
        stringStates: [
            {finger: 'o', text: ''},
            {finger: 0, text: '1'},
            {finger: 'o', text: ''},
            {finger: 1, text: '2'},
            {finger: 2, text: '3'},
            {finger: 'x', text: ''},
        ],
        relativeX: 0,
        relativeY: 0,
        relativeW: 1,
        relativeH: 1,
    },

    isSlap: false,

}
const note2: TabNote = {

    id: Date.now() + 1,

    type: NoteSymbolTypeEnum.Note,
    isSlap: false,
    chord: emptyChord,
    notesInfo: [{
        id: noteInfoId3,
        type: TabNoteInfoTypeEnum.Arpeggio,
        chronaxie: 8,
        regionRange: {
            start: 2,
            end: 5
        }, // 这个含义是第几条线， 0是第一线，1是第二线...

        value: 21, // 品，-1代表x
        beamType: BeamTypeEnum.Combined,
        augmentationDot: {
            id: Date.now() + 2,
            count: 3
        },
        affiliatedSymbols: []
    }, {
        id: noteInfoId4,
        type: TabNoteInfoTypeEnum.Normal,
        chronaxie: 128,
        region: 2, // 这个含义是第几条线， 0是第一线，1是第二线...

        value: 6, // 品，-1代表x
        bend: {
            id: Date.now() + 50,
            type: BendTypeEnum.BendRelease,
            periodOne: 1,
            periodTwo: 0.5,
            relativeX: 0,
            relativeY: 0,
            relativeW: 1,
            relativeH: 1,
        },
        beamType: BeamTypeEnum.None,

        affiliatedSymbols: []
    }]


}

const note3: TabNote = {
    id: Date.now() + 3,
    type: NoteSymbolTypeEnum.Note,
    isSlap: true,
    chord: emptyChord,
    notesInfo: [
        {
            id: noteSlapId1,
            type: TabNoteInfoTypeEnum.Normal,
            chronaxie: 64,
            region: 5,
            value: -1,
            beamType: BeamTypeEnum.None,
            affiliatedSymbols: [],
        },
        {
            id: noteSlapId2,
            type: TabNoteInfoTypeEnum.Normal,
            chronaxie: 64,
            region: 2,
            value: -1,
            beamType: BeamTypeEnum.None,
            affiliatedSymbols: [],
        },
        {
            id: noteSlapId3,
            type: TabNoteInfoTypeEnum.Normal,
            chronaxie: 64,
            region: 0,
            value: -1,
            beamType: BeamTypeEnum.None,
            affiliatedSymbols: [],
        },
    ],
    relativeX: 0,
    relativeY: 0,
    relativeW: 1,
    relativeH: 1,
}

const noteHarmonicId = Date.now() + 40

const note4: TabNote = {
    id: Date.now() + 4,
    type: NoteSymbolTypeEnum.Note,
    isSlap: false,
    chord: emptyChord,
    notesInfo: [{
        id: noteHarmonicId,
        type: TabNoteInfoTypeEnum.Harmonic,
        chronaxie: 64,
        region: 1,
        value: 12,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
    }],
}

grandStaff1.staves[0].measures[0].notes.push(note)
grandStaff1.staves[0].measures[0].notes.push(note2)
grandStaff1.staves[0].measures[0].notes.push(note3)
grandStaff1.staves[0].measures[0].notes.push(note4)

// 连音线：第一槽位 region 0 → 第二槽位 region 2
data.affiliatedSymbols.push({
    id: Date.now() + 100,
    name: DoubleNoteAffiliatedSymbolNameEnum.Slur,
    startId: noteInfoId1,
    endId: noteInfoId4,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
    data: {
        slur: {
            relativeStartPoint: {x: 0, y: 0},
            relativeEndPoint: {x: 0, y: 0},
            relativeControlPoint: {x: 0, y: 0},
            thickness: 8,
            type: SlurTypeEnum.H,
            relativeTextPoint: {x: 0, y: 30},
        },
    },
})

export default data
