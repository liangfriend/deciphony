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
