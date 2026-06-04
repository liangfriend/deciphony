/**
 * musicScoreToVDom 实现：宏观布局 + 小节符号 + 符杠 + 附属型符号
 */
import { Skin, SlotConfig, VDom } from "@/types/common";
import { MusicScore } from "@/types/MusicScoreType";
export declare function musicScoreToVDom(musicScore: MusicScore, slotConfig?: SlotConfig, options?: {
    skin?: Skin;
    skinName?: string;
}): VDom[];
