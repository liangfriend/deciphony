import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
export interface InstrumentConfig {
    setupScene: (container: HTMLDivElement) => {
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        controls: OrbitControls;
    };
}
export declare const instrumentConfig: Record<string, InstrumentConfig>;
