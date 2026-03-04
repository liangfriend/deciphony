import { Skin, VDom } from "@/types/common";
import { MusicScoreTypeEnum } from "@/enums/musicScoreEnum";
type __VLS_Props = {
    node: VDom;
    /** 曲谱模式：五线谱用 standardStaff，简谱用 numberNotation */
    notationType?: MusicScoreTypeEnum;
    /** 多套皮肤包：skinName -> SkinPack；skinName=default 或未找到时使用内置 defaultSkin */
    skin?: Skin;
};
declare const _default: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
