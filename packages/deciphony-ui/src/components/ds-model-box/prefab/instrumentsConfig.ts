// src/components/ds-icon/instrumentConfig.ts
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'

export interface InstrumentConfig {
    setupScene: (container: HTMLDivElement) => {
        scene: THREE.Scene
        camera: THREE.PerspectiveCamera
        renderer: THREE.WebGLRenderer
        controls: OrbitControls
    }
}

export const instrumentConfig: Record<string, InstrumentConfig> = {
    Xiao: {
        setupScene: (container) => {
            // 1. 场景
            const scene = new THREE.Scene()
            scene.background = new THREE.Color(0xeeeeee)

            // 2. 相机
            const camera = new THREE.PerspectiveCamera(
                20,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            )
            camera.position.set(0, 1, 3)

            // 3. 渲染器
            const renderer = new THREE.WebGLRenderer({antialias: true})
            renderer.setSize(container.clientWidth, container.clientHeight)
            container.appendChild(renderer.domElement)

            // 4. 灯光
            const light = new THREE.DirectionalLight(0xffffff, 5)
            light.position.set(5, 5, 5)
            scene.add(light)
            scene.add(new THREE.AmbientLight(0x888888))

            // 5. 控制器
            const controls = new OrbitControls(camera, renderer.domElement)
            controls.enableDamping = true

            return {scene, camera, renderer, controls}
        }
    },

    // 🎸 以后添加其他乐器配置
    // Guitar: { ... }
}
