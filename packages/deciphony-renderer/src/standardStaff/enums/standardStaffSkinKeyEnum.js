/** 五线谱皮肤 key：一谱一套，仅用于 standardStaff */
export var StandardStaffSkinKeyEnum;
(function (StandardStaffSkinKeyEnum) {
    StandardStaffSkinKeyEnum["Measure"] = "measure";
    StandardStaffSkinKeyEnum["Treble"] = "treble";
    StandardStaffSkinKeyEnum["Alto"] = "alto";
    StandardStaffSkinKeyEnum["Bass"] = "bass";
    StandardStaffSkinKeyEnum["Tenor"] = "Tenor";
    StandardStaffSkinKeyEnum["Treble_f"] = "treble_f";
    StandardStaffSkinKeyEnum["Alto_f"] = "alto_f";
    StandardStaffSkinKeyEnum["Bass_f"] = "bass_f";
    StandardStaffSkinKeyEnum["Tenor_f"] = "tenor_f";
    StandardStaffSkinKeyEnum["Sharp"] = "sharp";
    StandardStaffSkinKeyEnum["Flat"] = "flat";
    StandardStaffSkinKeyEnum["Double_sharp"] = "double_sharp";
    StandardStaffSkinKeyEnum["Double_flat"] = "double_flat";
    StandardStaffSkinKeyEnum["Natural"] = "natural";
    // 闭合线（单谱表第一小节左侧）
    StandardStaffSkinKeyEnum["Close_line"] = "close_line";
    StandardStaffSkinKeyEnum["linked_close_line"] = "linked_close_line";
    // 小节线
    StandardStaffSkinKeyEnum["Single_barline"] = "single_barline";
    StandardStaffSkinKeyEnum["Double_barline"] = "double_barline";
    StandardStaffSkinKeyEnum["StartRepeat_barline"] = "startRepeat_barline";
    StandardStaffSkinKeyEnum["EndRepeat_barline"] = "endRepeat_barline";
    StandardStaffSkinKeyEnum["Dashed_barline"] = "dashed_barline";
    StandardStaffSkinKeyEnum["Final_barline"] = "final_barline";
    StandardStaffSkinKeyEnum["Start_end_repeat_barline"] = "start_end_repeat_barline";
    StandardStaffSkinKeyEnum["Dotted_barline"] = "dotted_barline";
    StandardStaffSkinKeyEnum["Reverse_barline"] = "reverse_barline";
    StandardStaffSkinKeyEnum["Heavy_barline"] = "heavy_barline";
    StandardStaffSkinKeyEnum["Heavy_double_barline"] = "heavy_double_barline";
    // 连谱小节线
    StandardStaffSkinKeyEnum["linked_single_barline"] = "linked_single_barline";
    StandardStaffSkinKeyEnum["linked_double_barline"] = "linked_double_barline";
    StandardStaffSkinKeyEnum["linked_startRepeat_barline"] = "linked_startRepeat_barline";
    StandardStaffSkinKeyEnum["linked_endRepeat_barline"] = "linked_endRepeat_barline";
    StandardStaffSkinKeyEnum["linked_dashed_barline"] = "linked_dashed_barline";
    StandardStaffSkinKeyEnum["linked_final_barline"] = "linked_final_barline";
    StandardStaffSkinKeyEnum["linked_start_end_repeat_barline"] = "linked_start_end_repeat_barline";
    StandardStaffSkinKeyEnum["linked_dotted_barline"] = "linked_dotted_barline";
    StandardStaffSkinKeyEnum["linked_reverse_barline"] = "linked_reverse_barline";
    StandardStaffSkinKeyEnum["linked_heavy_barline"] = "linked_heavy_barline";
    StandardStaffSkinKeyEnum["linked_heavy_double_barline"] = "linked_heavy_double_barline";
    // 调号，这个皮肤做的时候按照treble去定位。代码里自动对其它谱号进行y值偏移
    StandardStaffSkinKeyEnum["C"] = "C";
    StandardStaffSkinKeyEnum["C_sharp"] = "C_sharp";
    StandardStaffSkinKeyEnum["D_flat"] = "D_flat";
    StandardStaffSkinKeyEnum["D"] = "D";
    StandardStaffSkinKeyEnum["E_flat"] = "E_flat";
    StandardStaffSkinKeyEnum["E"] = "E";
    StandardStaffSkinKeyEnum["F"] = "F";
    StandardStaffSkinKeyEnum["F_sharp"] = "F_sharp";
    StandardStaffSkinKeyEnum["G_flat"] = "G_flat";
    StandardStaffSkinKeyEnum["G"] = "G";
    StandardStaffSkinKeyEnum["A_flat"] = "A_flat";
    StandardStaffSkinKeyEnum["A"] = "A";
    StandardStaffSkinKeyEnum["B_flat"] = "B_flat";
    StandardStaffSkinKeyEnum["B"] = "B";
    StandardStaffSkinKeyEnum["C_flat"] = "C_flat";
    // TODO 这个后续还要有第二类， 因为有Soprano baritone等等调号，变音符的排序是倒过来的，但是用的较少，这里暂时先不去写
    // C_2 = 'C_2',
    // C_sharp_2 = 'C_sharp_2',
    // D_flat_2 = 'D_flat_2',
    // D_2 = 'D_2',
    // E_flat_2 = 'E_flat_2',
    // E_2 = 'E_2',
    // F_2 = 'F_2',
    // F_sharp_2 = 'F_sharp_2',
    // G_flat_2 = 'G_flat_2',
    // G_2 = 'G_2',
    // A_flat_2 = 'A_flat_2',
    // A_2 = 'A_2',
    // B_flat_2 = 'B_flat_2',
    // B_2 = 'B_2',
    // C_flat_2 = 'C_flat_2',
    // 拍号
    StandardStaffSkinKeyEnum["1_1"] = "1_1";
    StandardStaffSkinKeyEnum["1_4"] = "1_4";
    StandardStaffSkinKeyEnum["2_4"] = "2_4";
    StandardStaffSkinKeyEnum["3_4"] = "3_4";
    StandardStaffSkinKeyEnum["4_4"] = "4_4";
    StandardStaffSkinKeyEnum["3_8"] = "3_8";
    StandardStaffSkinKeyEnum["6_8"] = "6_8";
    StandardStaffSkinKeyEnum["NoteHead_1"] = "noteHead_1";
    StandardStaffSkinKeyEnum["NoteHead_2"] = "noteHead_2";
    StandardStaffSkinKeyEnum["NoteHead_3"] = "noteHead_3";
    StandardStaffSkinKeyEnum["NoteStem"] = "notestem";
    StandardStaffSkinKeyEnum["NoteTail_1"] = "noteTail_1";
    StandardStaffSkinKeyEnum["NoteTail_2"] = "noteTail_2";
    StandardStaffSkinKeyEnum["NoteTail_3"] = "noteTail_3";
    StandardStaffSkinKeyEnum["NoteTail_4"] = "noteTail_4";
    StandardStaffSkinKeyEnum["NoteTail_5"] = "noteTail_5";
    StandardStaffSkinKeyEnum["NoteTail_6"] = "noteTail_6";
    StandardStaffSkinKeyEnum["NoteTail_1_r"] = "noteTail_1_r";
    StandardStaffSkinKeyEnum["NoteTail_2_r"] = "noteTail_2_r";
    StandardStaffSkinKeyEnum["NoteTail_3_r"] = "noteTail_3_r";
    StandardStaffSkinKeyEnum["NoteTail_4_r"] = "noteTail_4_r";
    StandardStaffSkinKeyEnum["NoteTail_5_r"] = "noteTail_5_r";
    StandardStaffSkinKeyEnum["NoteTail_6_r"] = "noteTail_6_r";
    StandardStaffSkinKeyEnum["Rest_1"] = "rest_1";
    StandardStaffSkinKeyEnum["Rest_2"] = "rest_2";
    StandardStaffSkinKeyEnum["Rest_3"] = "rest_3";
    StandardStaffSkinKeyEnum["Rest_4"] = "rest_4";
    StandardStaffSkinKeyEnum["Rest_5"] = "rest_5";
    StandardStaffSkinKeyEnum["Rest_6"] = "rest_6";
    StandardStaffSkinKeyEnum["Rest_7"] = "rest_7";
    StandardStaffSkinKeyEnum["Rest_8"] = "rest_8";
    StandardStaffSkinKeyEnum["Rest_9"] = "rest_9";
    StandardStaffSkinKeyEnum["AugmentationDot_1"] = "augmentationDot_1";
    StandardStaffSkinKeyEnum["AugmentationDot_2"] = "augmentationDot_2";
    StandardStaffSkinKeyEnum["AugmentationDot_3"] = "augmentationDot_3";
    StandardStaffSkinKeyEnum["AddLine_u"] = "addLine_u";
    StandardStaffSkinKeyEnum["AddLine_d"] = "addLine_d";
    // 连谱号
    StandardStaffSkinKeyEnum["Bracket"] = "bracket";
    StandardStaffSkinKeyEnum["Brace"] = "brace";
    StandardStaffSkinKeyEnum["Square"] = "square";
    // 反复符号（不含反复小节线与 volta）
    StandardStaffSkinKeyEnum["Repeat_coda"] = "repeat_coda";
    StandardStaffSkinKeyEnum["Repeat_to_coda"] = "repeat_to_coda";
    StandardStaffSkinKeyEnum["Repeat_segno"] = "repeat_segno";
    StandardStaffSkinKeyEnum["Repeat_dc"] = "repeat_dc";
    StandardStaffSkinKeyEnum["Repeat_ds"] = "repeat_ds";
    StandardStaffSkinKeyEnum["Repeat_fine"] = "repeat_fine";
    StandardStaffSkinKeyEnum["Repeat_dc_al_fine"] = "repeat_dc_al_fine";
    StandardStaffSkinKeyEnum["Repeat_dc_al_coda"] = "repeat_dc_al_coda";
    StandardStaffSkinKeyEnum["Repeat_ds_al_fine"] = "repeat_ds_al_fine";
    StandardStaffSkinKeyEnum["Repeat_ds_al_coda"] = "repeat_ds_al_coda";
    // 双音符附属符号没有皮肤，所以不写
    // 双小节附属符号没有皮肤，所以不写
    // 单音符附属符号
    StandardStaffSkinKeyEnum["Accent_above"] = "acccent_above";
    StandardStaffSkinKeyEnum["Staccato_above"] = "staccato_above";
    StandardStaffSkinKeyEnum["Staccatissimo_above"] = "staccato_above";
    StandardStaffSkinKeyEnum["Tenuto_above"] = "tenuto_above";
    StandardStaffSkinKeyEnum["Loure_above"] = "loure_above";
    StandardStaffSkinKeyEnum["Marcato_above"] = "marcato_above";
    StandardStaffSkinKeyEnum["Accent_staccato_above"] = "accent_staccato_above";
    StandardStaffSkinKeyEnum["Marcato_staccato_above"] = "marcato_staccato_above";
    StandardStaffSkinKeyEnum["Marcato_tenuto_above"] = "marcato_tenuto_above";
    StandardStaffSkinKeyEnum["Staccatissimo_stroke_above"] = "staccatissimo_stroke_above";
    StandardStaffSkinKeyEnum["Staccatissimo_wedge_above"] = "staccatissimo_wedge_above";
    StandardStaffSkinKeyEnum["Stress_above"] = "stress_above";
    StandardStaffSkinKeyEnum["Tenuto_accent_above"] = "tenuto_accent_above";
    StandardStaffSkinKeyEnum["Unstress_above"] = "unstress_above";
    StandardStaffSkinKeyEnum["Open"] = "open";
    StandardStaffSkinKeyEnum["Muted"] = "muted";
    StandardStaffSkinKeyEnum["Harmonic"] = "harmonic";
    StandardStaffSkinKeyEnum["Up_bow"] = "up_bow";
    StandardStaffSkinKeyEnum["Down_bow"] = "down_bow";
    // ornaments
    StandardStaffSkinKeyEnum["Turn"] = "turn";
    StandardStaffSkinKeyEnum["InvertedTurn"] = "invertedTurn";
    StandardStaffSkinKeyEnum["Trill"] = "trill";
    StandardStaffSkinKeyEnum["ShortTrill"] = "shortTrill";
    StandardStaffSkinKeyEnum["Mordent"] = "mordent";
    // Arpeggios
    StandardStaffSkinKeyEnum["Arpeggio"] = "arpeggio";
    StandardStaffSkinKeyEnum["Up_arpeggio"] = "up_arpeggio";
    StandardStaffSkinKeyEnum["Down_arpeggio"] = "down_arpeggio";
    StandardStaffSkinKeyEnum["Bracket_arpeggio"] = "bracket_arpeggio";
    StandardStaffSkinKeyEnum["Up_arpeggio_straight"] = "up_arpeggio_straight";
    StandardStaffSkinKeyEnum["Down_arpeggio_straight"] = "down_arpeggio_straight";
    // glissandos TODO 这个暂时不做
    // dynamics 强弱记号
    StandardStaffSkinKeyEnum["Dyn_PPP"] = "dyn_ppp";
    StandardStaffSkinKeyEnum["Dyn_PP"] = "dyn_pp";
    StandardStaffSkinKeyEnum["Dyn_P"] = "dyn_p";
    StandardStaffSkinKeyEnum["Dyn_MP"] = "dyn_mp";
    StandardStaffSkinKeyEnum["Dyn_MF"] = "dyn_mf";
    StandardStaffSkinKeyEnum["Dyn_F"] = "dyn_f";
    StandardStaffSkinKeyEnum["Dyn_FF"] = "dyn_ff";
    StandardStaffSkinKeyEnum["Dyn_FFF"] = "dyn_fff";
    StandardStaffSkinKeyEnum["Dyn_FP"] = "dyn_fp";
    StandardStaffSkinKeyEnum["Dyn_PF"] = "dyn_pf";
    StandardStaffSkinKeyEnum["Dyn_SF"] = "dyn_sf";
    StandardStaffSkinKeyEnum["Dyn_SFZ"] = "dyn_sfz";
    StandardStaffSkinKeyEnum["Dyn_SFF"] = "dyn_sff";
    StandardStaffSkinKeyEnum["Dyn_SFFZ"] = "dyn_sffz";
    StandardStaffSkinKeyEnum["Dyn_SFP"] = "dyn_sfp";
    StandardStaffSkinKeyEnum["Dyn_RFZ"] = "dyn_rfz";
    StandardStaffSkinKeyEnum["Dyn_RF"] = "dyn_rf";
    StandardStaffSkinKeyEnum["Dyn_FZ"] = "dyn_fz";
    // TODO 单小节附属符号没有皮肤，所以不写
})(StandardStaffSkinKeyEnum || (StandardStaffSkinKeyEnum = {}));
