declare module 'three/examples/jsm/controls/OrbitControls' {
    import {Camera, EventDispatcher, MOUSE, TOUCH, Vector3} from 'three';

    export class OrbitControls extends EventDispatcher {
        object: Camera;
        domElement: HTMLElement | Document;
        enabled: boolean;
        target: Vector3;
        minDistance: number;
        maxDistance: number;
        minZoom: number;
        maxZoom: number;
        minPolarAngle: number;
        maxPolarAngle: number;
        minAzimuthAngle: number;
        maxAzimuthAngle: number;
        enableDamping: boolean;
        dampingFactor: number;
        enableZoom: boolean;
        zoomSpeed: number;
        enableRotate: boolean;
        rotateSpeed: number;
        enablePan: boolean;
        panSpeed: number;
        screenSpacePanning: boolean;
        keyPanSpeed: number;
        autoRotate: boolean;
        autoRotateSpeed: number;
        keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
        mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
        touches: { ONE: TOUCH; TWO: TOUCH };

        constructor(object: Camera, domElement?: HTMLElement);

        update(): boolean;

        saveState(): void;

        reset(): void;

        dispose(): void;

        getPolarAngle(): number;

        getAzimuthalAngle(): number;

        listenToKeyEvents(domElement: HTMLElement): void;

        stopListenToKeyEvents(): void;
    }
}
declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import {AnimationClip, Camera, Group, Loader, LoadingManager} from 'three';

    export interface GLTF {
        animations: AnimationClip[];
        scene: Group;
        scenes: Group[];
        cameras: Camera[];
        asset: {
            version: string;
            generator: string;
        };
        parser: GLTFParser;
        userData: any;
    }

    export interface GLTFReference {
        type: 'scene' | 'node' | 'material' | 'texture' | 'animation';
        index: number;
    }

    export interface GLTFParser {
        json: any;
        extensions: any;
        options: any;

        getDependency(type: string, index: number): Promise<any>;

        getDependencies(type: string): Promise<any[]>;

        parse(onLoad: (gltf: GLTF) => void, onError?: (error: ErrorEvent) => void): void;
    }

    export class GLTFLoader extends Loader {
        constructor(manager?: LoadingManager);

        load(
            url: string,
            onLoad: (gltf: GLTF) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (event: ErrorEvent) => void
        ): void;

        parse(
            data: ArrayBuffer | string,
            path: string,
            onLoad: (gltf: GLTF) => void,
            onError?: (event: ErrorEvent) => void
        ): void;

        setDRACOLoader(dracoLoader: any): this;

        setKTX2Loader(ktx2Loader: any): this;

        setMeshoptDecoder(meshoptDecoder: any): this;
    }
}
