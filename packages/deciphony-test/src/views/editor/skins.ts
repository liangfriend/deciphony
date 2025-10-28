import {ref} from "vue";
import number_1 from "../../assets/skins/bamboo/1.svg";
import number_2 from "../../assets/skins/bamboo/2.svg";
import number_3 from "../../assets/skins/bamboo/3.svg";
import number_4 from "../../assets/skins/bamboo/4.svg";
import number_5 from "../../assets/skins/bamboo/5.svg";
import number_6 from "../../assets/skins/bamboo/6.svg";
import number_7 from "../../assets/skins/bamboo/7.svg";
import clef_alto from "../../assets/skins/bamboo/altoClef.svg";
import clef_bass from "../../assets/skins/bamboo/bassClef.svg";
import clef_treble from "../../assets/skins/bamboo/trebleClef.svg";
import bar_numberNotation from "../../assets/skins/bamboo/bar-numberNotation.svg";
import bar_standardStaff from "../../assets/skins/bamboo/bar-standardStaff.svg";
import barLine_endRepeatSign from "../../assets/skins/bamboo/barlineEndRepeatSign.svg";
import barLine_final from "../../assets/skins/bamboo/barlineFinal.svg";
import barline_reverseFinal from "../../assets/skins/bamboo/barlineReverseFinal.svg";
import barline_single from "../../assets/skins/bamboo/barlineSingle.svg";
import barline_startRepeatSign from "../../assets/skins/bamboo/barlineStartRepeatSign.svg";
import chronaxieIncreasingLine from "../../assets/skins/bamboo/chronaxieIncreasingLine.svg";
import chronaxieReducingLine_1 from "../../assets/skins/bamboo/chronaxieReducingLine1.svg";
import chronaxieReducingLine_2 from "../../assets/skins/bamboo/chronaxieReducingLine2.svg";
import chronaxieReducingLine_3 from "../../assets/skins/bamboo/chronaxieReducingLine3.svg";
import chronaxieReducingLine_4 from "../../assets/skins/bamboo/chronaxieReducingLine4.svg";
import accidental_doubleFlat from "../../assets/skins/bamboo/doubleFlat.svg";
import accidental_doubleSharp from "../../assets/skins/bamboo/doubleSharp.svg";
import accidental_flat from "../../assets/skins/bamboo/flat.svg";
import accidental_sharp from "../../assets/skins/bamboo/sharp.svg";
import accidental_nature from "../../assets/skins/bamboo/nature.svg";
import noteDot_1 from "../../assets/skins/bamboo/noteDot1.svg";
import noteDot_2 from "../../assets/skins/bamboo/noteDot2.svg";
import noteDot_3 from "../../assets/skins/bamboo/noteDot3.svg";
import noteDot_4 from "../../assets/skins/bamboo/noteDot4.svg";
import noteHead_1 from "../../assets/skins/bamboo/noteHead1.svg";
import noteHead_2 from "../../assets/skins/bamboo/noteHead2.svg";
import noteHead_4 from "../../assets/skins/bamboo/noteHead4.svg";
import noteStem from "../../assets/skins/bamboo/noteStem.svg";
import noteTail_8 from "../../assets/skins/bamboo/noteTail8.svg";
import noteTail_16 from "../../assets/skins/bamboo/noteTail16.svg";
import noteTail_32 from "../../assets/skins/bamboo/noteTail32.svg";
import noteTail_64 from "../../assets/skins/bamboo/noteTail64.svg";
import noteTail_128 from "../../assets/skins/bamboo/noteTail128.svg";
import noteTail_256 from "../../assets/skins/bamboo/noteTail256.svg";
import rest_1 from "../../assets/skins/bamboo/rest1.svg";
import rest_2 from "../../assets/skins/bamboo/rest2.svg";
import rest_4 from "../../assets/skins/bamboo/rest4.svg";
import rest_8 from "../../assets/skins/bamboo/rest8.svg";
import rest_16 from "../../assets/skins/bamboo/rest16.svg";
import rest_32 from "../../assets/skins/bamboo/rest32.svg";
import rest_64 from "../../assets/skins/bamboo/rest64.svg";
import rest_128 from "../../assets/skins/bamboo/rest128.svg";
import rest_256 from "../../assets/skins/bamboo/rest256.svg";

// ==================== 激活模式 ====================
// ==================== 数字符号 ====================
import active_number_1 from '../../assets/skins/bamboo/1_active.svg'
import active_number_2 from '../../assets/skins/bamboo/2_active.svg'
import active_number_3 from '../../assets/skins/bamboo/3_active.svg'
import active_number_4 from '../../assets/skins/bamboo/4_active.svg'
import active_number_5 from '../../assets/skins/bamboo/5_active.svg'
import active_number_6 from '../../assets/skins/bamboo/6_active.svg'
import active_number_7 from '../../assets/skins/bamboo/7_active.svg'

// ==================== 谱号 ====================
import active_clef_alto from '../../assets/skins/bamboo/altoClef_active.svg'
import active_clef_bass from '../../assets/skins/bamboo/bassClef_active.svg'
import active_clef_treble from '../../assets/skins/bamboo/trebleClef_active.svg'

// ==================== 小节线 ====================
import active_bar_numberNotation from '../../assets/skins/bamboo/bar-numberNotation_active.svg'
import active_bar_standardStaff from '../../assets/skins/bamboo/bar-standardStaff_active.svg'
import active_barLine_endRepeatSign from '../../assets/skins/bamboo/barlineEndRepeatSign_active.svg'
import active_barLine_final from '../../assets/skins/bamboo/barlineFinal_active.svg'
import active_barline_reverseFinal from '../../assets/skins/bamboo/barlineReverseFinal_active.svg'
import active_barline_single from '../../assets/skins/bamboo/barlineSingle_active.svg'
import active_barline_startRepeatSign from '../../assets/skins/bamboo/barlineStartRepeatSign_active.svg'

// ==================== 时值延长线 ====================
import active_chronaxieIncreasingLine from '../../assets/skins/bamboo/chronaxieIncreasingLine_active.svg'

// ==================== 变音符号 ====================
import active_accidental_doubleFlat from '../../assets/skins/bamboo/doubleFlat_active.svg'
import active_accidental_doubleSharp from '../../assets/skins/bamboo/doubleSharp_active.svg'
import active_accidental_flat from '../../assets/skins/bamboo/flat_active.svg'
import active_accidental_sharp from '../../assets/skins/bamboo/sharp_active.svg'
import active_accidental_nature from '../../assets/skins/bamboo/nature_active.svg'

// ==================== 附点 ====================

// ==================== 音符主体 ====================
import active_noteHead_1 from '../../assets/skins/bamboo/noteHead1_active.svg'
import active_noteHead_2 from '../../assets/skins/bamboo/noteHead2_active.svg'
import active_noteHead_4 from '../../assets/skins/bamboo/noteHead4_active.svg'

// ==================== 音符符干 ====================
import active_noteStem from '../../assets/skins/bamboo/noteStem_active.svg'

// ==================== 音符符尾 ====================
import active_noteTail_8 from '../../assets/skins/bamboo/noteTail8_active.svg'
import active_noteTail_16 from '../../assets/skins/bamboo/noteTail16_active.svg'
import active_noteTail_32 from '../../assets/skins/bamboo/noteTail32_active.svg'
import active_noteTail_64 from '../../assets/skins/bamboo/noteTail64_active.svg'
import active_noteTail_128 from '../../assets/skins/bamboo/noteTail128_active.svg'
import active_noteTail_256 from '../../assets/skins/bamboo/noteTail256_active.svg'

// ==================== 休止符 ====================
import active_rest_1 from '../../assets/skins/bamboo/rest1_active.svg'
import active_rest_2 from '../../assets/skins/bamboo/rest2_active.svg'
import active_rest_4 from '../../assets/skins/bamboo/rest4_active.svg'
import active_rest_8 from '../../assets/skins/bamboo/rest8_active.svg'
import active_rest_16 from '../../assets/skins/bamboo/rest16_active.svg'
import active_rest_32 from '../../assets/skins/bamboo/rest32_active.svg'
import active_rest_64 from '../../assets/skins/bamboo/rest64_active.svg'
import active_rest_128 from '../../assets/skins/bamboo/rest128_active.svg'
import active_rest_256 from '../../assets/skins/bamboo/rest256_active.svg'


export const skin_bamboo = ref<Record<string, { url: string }>>({
    skinKey: {url: 'bamboo'},
    // 数字
    number_1: {url: number_1},
    number_2: {url: number_2},
    number_3: {url: number_3},
    number_4: {url: number_4},
    number_5: {url: number_5},
    number_6: {url: number_6},
    number_7: {url: number_7},

    // 谱号
    clef_alto: {url: clef_alto},
    clef_bass: {url: clef_bass},
    clef_treble: {url: clef_treble},

    // 小节线
    bar_numberNotation: {url: bar_numberNotation},
    bar_standardStaff: {url: bar_standardStaff},
    barLine_endRepeatSign: {url: barLine_endRepeatSign},
    barLine_final: {url: barLine_final},
    barline_reverseFinal: {url: barline_reverseFinal},
    barline_single: {url: barline_single},
    barline_startRepeatSign: {url: barline_startRepeatSign},

    // 时值延长线
    chronaxieIncreasingLine: {url: chronaxieIncreasingLine},
    chronaxieReducingLine_1: {url: chronaxieReducingLine_1},
    chronaxieReducingLine_2: {url: chronaxieReducingLine_2},
    chronaxieReducingLine_3: {url: chronaxieReducingLine_3},
    chronaxieReducingLine_4: {url: chronaxieReducingLine_4},

    // 变音符号
    accidental_doubleFlat: {url: accidental_doubleFlat},
    accidental_doubleSharp: {url: accidental_doubleSharp},
    accidental_flat: {url: accidental_flat},
    accidental_sharp: {url: accidental_sharp},
    accidental_nature: {url: accidental_nature},

    // 附点
    noteDot_1: {url: noteDot_1},
    noteDot_2: {url: noteDot_2},
    noteDot_3: {url: noteDot_3},
    noteDot_4: {url: noteDot_4},

    // 音符主体
    noteHead_1: {url: noteHead_1},
    noteHead_2: {url: noteHead_2},
    noteHead_4: {url: noteHead_4},

    // 音符符干与符尾
    noteStem: {url: noteStem},
    noteTail_8: {url: noteTail_8},
    noteTail_16: {url: noteTail_16},
    noteTail_32: {url: noteTail_32},
    noteTail_64: {url: noteTail_64},
    noteTail_128: {url: noteTail_128},
    noteTail_256: {url: noteTail_256},

    // 休止符
    rest_1: {url: rest_1},
    rest_2: {url: rest_2},
    rest_4: {url: rest_4},
    rest_8: {url: rest_8},
    rest_16: {url: rest_16},
    rest_32: {url: rest_32},
    rest_64: {url: rest_64},
    rest_128: {url: rest_128},
    rest_256: {url: rest_256},

    // 激活模式（active_前缀）
    active_number_1: {url: active_number_1},
    active_number_2: {url: active_number_2},
    active_number_3: {url: active_number_3},
    active_number_4: {url: active_number_4},
    active_number_5: {url: active_number_5},
    active_number_6: {url: active_number_6},
    active_number_7: {url: active_number_7},

    active_clef_alto: {url: active_clef_alto},
    active_clef_bass: {url: active_clef_bass},
    active_clef_treble: {url: active_clef_treble},

    active_bar_numberNotation: {url: active_bar_numberNotation},
    active_bar_standardStaff: {url: active_bar_standardStaff},
    active_barLine_endRepeatSign: {url: active_barLine_endRepeatSign},
    active_barLine_final: {url: active_barLine_final},
    active_barline_reverseFinal: {url: active_barline_reverseFinal},
    active_barline_single: {url: active_barline_single},
    active_barline_startRepeatSign: {url: active_barline_startRepeatSign},

    active_chronaxieIncreasingLine: {url: active_chronaxieIncreasingLine},

    active_accidental_doubleFlat: {url: active_accidental_doubleFlat},
    active_accidental_doubleSharp: {url: active_accidental_doubleSharp},
    active_accidental_flat: {url: active_accidental_flat},
    active_accidental_sharp: {url: active_accidental_sharp},
    active_accidental_nature: {url: active_accidental_nature},


    active_noteHead_1: {url: active_noteHead_1},
    active_noteHead_2: {url: active_noteHead_2},
    active_noteHead_4: {url: active_noteHead_4},

    active_noteStem: {url: active_noteStem},
    active_noteTail_8: {url: active_noteTail_8},
    active_noteTail_16: {url: active_noteTail_16},
    active_noteTail_32: {url: active_noteTail_32},
    active_noteTail_64: {url: active_noteTail_64},
    active_noteTail_128: {url: active_noteTail_128},
    active_noteTail_256: {url: active_noteTail_256},

    active_rest_1: {url: active_rest_1},
    active_rest_2: {url: active_rest_2},
    active_rest_4: {url: active_rest_4},
    active_rest_8: {url: active_rest_8},
    active_rest_16: {url: active_rest_16},
    active_rest_32: {url: active_rest_32},
    active_rest_64: {url: active_rest_64},
    active_rest_128: {url: active_rest_128},
    active_rest_256: {url: active_rest_256},
})