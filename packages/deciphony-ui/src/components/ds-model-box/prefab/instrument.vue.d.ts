import * as THREE from 'three';
declare function toggleEmission(id: string, on: boolean): void;
declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    model: {
        default: string;
        type: StringConstructor;
    };
}>, {
    toggleEmission: typeof toggleEmission;
    eventMap: import("vue").Ref<Record<string, {
        type: string;
        value: number;
        mesh: THREE.Mesh;
    }>, Record<string, {
        type: string;
        value: number;
        mesh: THREE.Mesh;
    }>>;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    model: {
        default: string;
        type: StringConstructor;
    };
}>> & Readonly<{}>, {
    model: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
