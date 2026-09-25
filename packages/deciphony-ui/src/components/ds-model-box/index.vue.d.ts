import { PropType } from 'vue';
import { BoxType, ModelEnum } from "@/types/enum";
declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    type: {
        default: BoxType;
        type: PropType<BoxType>;
    };
    model: {
        default: ModelEnum;
        type: PropType<ModelEnum>;
    };
}>, {
    modelRef: import("vue").Ref<null, null>;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    type: {
        default: BoxType;
        type: PropType<BoxType>;
    };
    model: {
        default: ModelEnum;
        type: PropType<ModelEnum>;
    };
}>> & Readonly<{}>, {
    type: BoxType;
    model: ModelEnum;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
