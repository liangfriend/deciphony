/** 简谱皮肤 key：一谱一套，仅用于 numberNotation */
export var NumberNotationSkinKeyEnum;
(function (NumberNotationSkinKeyEnum) {
    NumberNotationSkinKeyEnum["Measure"] = "measure";
    NumberNotationSkinKeyEnum["Sharp"] = "sharp";
    NumberNotationSkinKeyEnum["Flat"] = "flat";
    NumberNotationSkinKeyEnum["Double_sharp"] = "double_sharp";
    NumberNotationSkinKeyEnum["Double_flat"] = "double_flat";
    NumberNotationSkinKeyEnum["Natural"] = "natural";
    // 闭合线（单谱表第一小节左侧）
    NumberNotationSkinKeyEnum["Close_line"] = "close_line";
    NumberNotationSkinKeyEnum["linked_close_line"] = "linked_close_line";
    // 小节线
    NumberNotationSkinKeyEnum["Single_barline"] = "single_barline";
    NumberNotationSkinKeyEnum["Double_barline"] = "double_barline";
    NumberNotationSkinKeyEnum["StartRepeat_barline"] = "startRepeat_barline";
    NumberNotationSkinKeyEnum["EndRepeat_barline"] = "endRepeat_barline";
    NumberNotationSkinKeyEnum["Dashed_barline"] = "dashed_barline";
    NumberNotationSkinKeyEnum["Final_barline"] = "final_barline";
    NumberNotationSkinKeyEnum["Start_end_repeat_barline"] = "start_end_repeat_barline";
    NumberNotationSkinKeyEnum["Dotted_barline"] = "dotted_barline";
    NumberNotationSkinKeyEnum["Reverse_barline"] = "reverse_barline";
    NumberNotationSkinKeyEnum["Heavy_barline"] = "heavy_barline";
    NumberNotationSkinKeyEnum["Heavy_double_barline"] = "heavy_double_barline";
    // 连谱小节线
    NumberNotationSkinKeyEnum["linked_single_barline"] = "linked_single_barline";
    NumberNotationSkinKeyEnum["linked_double_barline"] = "linked_double_barline";
    NumberNotationSkinKeyEnum["linked_startRepeat_barline"] = "linked_startRepeat_barline";
    NumberNotationSkinKeyEnum["linked_endRepeat_barline"] = "linked_endRepeat_barline";
    NumberNotationSkinKeyEnum["linked_dashed_barline"] = "linked_dashed_barline";
    NumberNotationSkinKeyEnum["linked_final_barline"] = "linked_final_barline";
    NumberNotationSkinKeyEnum["linked_start_end_repeat_barline"] = "linked_start_end_repeat_barline";
    NumberNotationSkinKeyEnum["linked_dotted_barline"] = "linked_dotted_barline";
    NumberNotationSkinKeyEnum["linked_reverse_barline"] = "linked_reverse_barline";
    NumberNotationSkinKeyEnum["linked_heavy_barline"] = "linked_heavy_barline";
    NumberNotationSkinKeyEnum["linked_heavy_double_barline"] = "linked_heavy_double_barline";
    // 调号，这个皮肤做的时候按照treble去定位。代码里自动对其它谱号进行y值偏移
    NumberNotationSkinKeyEnum["C"] = "C";
    NumberNotationSkinKeyEnum["C_sharp"] = "C_sharp";
    NumberNotationSkinKeyEnum["D_flat"] = "D_flat";
    NumberNotationSkinKeyEnum["D"] = "D";
    NumberNotationSkinKeyEnum["E_flat"] = "E_flat";
    NumberNotationSkinKeyEnum["E"] = "E";
    NumberNotationSkinKeyEnum["F"] = "F";
    NumberNotationSkinKeyEnum["F_sharp"] = "F_sharp";
    NumberNotationSkinKeyEnum["G_flat"] = "G_flat";
    NumberNotationSkinKeyEnum["G"] = "G";
    NumberNotationSkinKeyEnum["A_flat"] = "A_flat";
    NumberNotationSkinKeyEnum["A"] = "A";
    NumberNotationSkinKeyEnum["B_flat"] = "B_flat";
    NumberNotationSkinKeyEnum["B"] = "B";
    NumberNotationSkinKeyEnum["C_flat"] = "C_flat";
    // 拍号
    NumberNotationSkinKeyEnum["1_1"] = "1_1";
    NumberNotationSkinKeyEnum["1_4"] = "1_4";
    NumberNotationSkinKeyEnum["2_4"] = "2_4";
    NumberNotationSkinKeyEnum["3_4"] = "3_4";
    NumberNotationSkinKeyEnum["4_4"] = "4_4";
    NumberNotationSkinKeyEnum["3_8"] = "3_8";
    NumberNotationSkinKeyEnum["6_8"] = "6_8";
    NumberNotationSkinKeyEnum["AugmentationDot_1"] = "augmentationDot_1";
    NumberNotationSkinKeyEnum["AugmentationDot_2"] = "augmentationDot_2";
    NumberNotationSkinKeyEnum["AugmentationDot_3"] = "augmentationDot_3";
    // 简谱专用：数字 0-7、减时线、高/低音点线
    NumberNotationSkinKeyEnum["Number_0"] = "number_0";
    NumberNotationSkinKeyEnum["Number_1"] = "number_1";
    NumberNotationSkinKeyEnum["Number_2"] = "number_2";
    NumberNotationSkinKeyEnum["Number_3"] = "number_3";
    NumberNotationSkinKeyEnum["Number_4"] = "number_4";
    NumberNotationSkinKeyEnum["Number_5"] = "number_5";
    NumberNotationSkinKeyEnum["Number_6"] = "number_6";
    NumberNotationSkinKeyEnum["Number_7"] = "number_7";
    NumberNotationSkinKeyEnum["Number_X"] = "number_X";
    NumberNotationSkinKeyEnum["ReduceLine_1"] = "reduceLine_1";
    NumberNotationSkinKeyEnum["ReduceLine_2"] = "reduceLine_2";
    NumberNotationSkinKeyEnum["ReduceLine_3"] = "reduceLine_3";
    NumberNotationSkinKeyEnum["ReduceLine_4"] = "reduceLine_4";
    NumberNotationSkinKeyEnum["ReduceLine_5"] = "reduceLine_5";
    NumberNotationSkinKeyEnum["ReduceLine_6"] = "reduceLine_6";
    NumberNotationSkinKeyEnum["addLine"] = "addLine";
    /** 八度点：音符上方=高八度，下方=低八度，每点表示一个八度 */
    NumberNotationSkinKeyEnum["OctaveDot"] = "octaveDot";
    // 连谱号
    NumberNotationSkinKeyEnum["Bracket"] = "bracket";
    NumberNotationSkinKeyEnum["Brace"] = "brace";
    NumberNotationSkinKeyEnum["Square"] = "square";
    // 反复符号
    NumberNotationSkinKeyEnum["Repeat_coda"] = "repeat_coda";
    NumberNotationSkinKeyEnum["Repeat_to_coda"] = "repeat_to_coda";
    NumberNotationSkinKeyEnum["Repeat_segno"] = "repeat_segno";
    NumberNotationSkinKeyEnum["Repeat_dc"] = "repeat_dc";
    NumberNotationSkinKeyEnum["Repeat_ds"] = "repeat_ds";
    NumberNotationSkinKeyEnum["Repeat_fine"] = "repeat_fine";
    NumberNotationSkinKeyEnum["Repeat_dc_al_fine"] = "repeat_dc_al_fine";
    NumberNotationSkinKeyEnum["Repeat_dc_al_coda"] = "repeat_dc_al_coda";
    NumberNotationSkinKeyEnum["Repeat_ds_al_fine"] = "repeat_ds_al_fine";
    NumberNotationSkinKeyEnum["Repeat_ds_al_coda"] = "repeat_ds_al_coda";
    // 双音符附属符号没有皮肤，所以不写
    // 双小节附属符号没有皮肤，所以不写
    // 单音符附属符号
    NumberNotationSkinKeyEnum["Accent_above"] = "acccent_above";
    NumberNotationSkinKeyEnum["Staccato_above"] = "staccato_above";
    NumberNotationSkinKeyEnum["Staccatissimo_above"] = "staccato_above";
    NumberNotationSkinKeyEnum["Tenuto_above"] = "tenuto_above";
    NumberNotationSkinKeyEnum["Loure_above"] = "loure_above";
    NumberNotationSkinKeyEnum["Marcato_above"] = "marcato_above";
    NumberNotationSkinKeyEnum["Accent_staccato_above"] = "accent_staccato_above";
    NumberNotationSkinKeyEnum["Marcato_staccato_above"] = "marcato_staccato_above";
    NumberNotationSkinKeyEnum["Marcato_tenuto_above"] = "marcato_tenuto_above";
    NumberNotationSkinKeyEnum["Staccatissimo_stroke_above"] = "staccatissimo_stroke_above";
    NumberNotationSkinKeyEnum["Staccatissimo_wedge_above"] = "staccatissimo_wedge_above";
    NumberNotationSkinKeyEnum["Stress_above"] = "stress_above";
    NumberNotationSkinKeyEnum["Tenuto_accent_above"] = "tenuto_accent_above";
    NumberNotationSkinKeyEnum["Unstress_above"] = "unstress_above";
    NumberNotationSkinKeyEnum["Open"] = "open";
    NumberNotationSkinKeyEnum["Muted"] = "muted";
    NumberNotationSkinKeyEnum["Harmonic"] = "harmonic";
    NumberNotationSkinKeyEnum["Up_bow"] = "up_bow";
    NumberNotationSkinKeyEnum["Down_bow"] = "down_bow";
    // ornaments
    NumberNotationSkinKeyEnum["Turn"] = "turn";
    NumberNotationSkinKeyEnum["InvertedTurn"] = "invertedTurn";
    NumberNotationSkinKeyEnum["Trill"] = "trill";
    NumberNotationSkinKeyEnum["ShortTrill"] = "shortTrill";
    NumberNotationSkinKeyEnum["Mordent"] = "mordent";
    // Arpeggios
    NumberNotationSkinKeyEnum["Arpeggio"] = "arpeggio";
    NumberNotationSkinKeyEnum["Up_arpeggio"] = "up_arpeggio";
    NumberNotationSkinKeyEnum["Down_arpeggio"] = "down_arpeggio";
    NumberNotationSkinKeyEnum["Bracket_arpeggio"] = "bracket_arpeggio";
    NumberNotationSkinKeyEnum["Up_arpeggio_straight"] = "up_arpeggio_straight";
    NumberNotationSkinKeyEnum["Down_arpeggio_straight"] = "down_arpeggio_straight";
    // glissandos TODO 这个暂时不做
    // dynamics 强弱记号
    NumberNotationSkinKeyEnum["Dyn_PPP"] = "dyn_ppp";
    NumberNotationSkinKeyEnum["Dyn_PP"] = "dyn_pp";
    NumberNotationSkinKeyEnum["Dyn_P"] = "dyn_p";
    NumberNotationSkinKeyEnum["Dyn_MP"] = "dyn_mp";
    NumberNotationSkinKeyEnum["Dyn_MF"] = "dyn_mf";
    NumberNotationSkinKeyEnum["Dyn_F"] = "dyn_f";
    NumberNotationSkinKeyEnum["Dyn_FF"] = "dyn_ff";
    NumberNotationSkinKeyEnum["Dyn_FFF"] = "dyn_fff";
    NumberNotationSkinKeyEnum["Dyn_FP"] = "dyn_fp";
    NumberNotationSkinKeyEnum["Dyn_PF"] = "dyn_pf";
    NumberNotationSkinKeyEnum["Dyn_SF"] = "dyn_sf";
    NumberNotationSkinKeyEnum["Dyn_SFZ"] = "dyn_sfz";
    NumberNotationSkinKeyEnum["Dyn_SFF"] = "dyn_sff";
    NumberNotationSkinKeyEnum["Dyn_SFFZ"] = "dyn_sffz";
    NumberNotationSkinKeyEnum["Dyn_SFP"] = "dyn_sfp";
    NumberNotationSkinKeyEnum["Dyn_RFZ"] = "dyn_rfz";
    NumberNotationSkinKeyEnum["Dyn_RF"] = "dyn_rf";
    NumberNotationSkinKeyEnum["Dyn_FZ"] = "dyn_fz";
    // TODO 单小节附属符号没有皮肤，所以不写
})(NumberNotationSkinKeyEnum || (NumberNotationSkinKeyEnum = {}));
