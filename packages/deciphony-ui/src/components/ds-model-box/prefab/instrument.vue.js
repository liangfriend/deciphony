import { onMounted, ref } from 'vue';
import xiaoModel from "@assets/models/xiao.glb?url";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { instrumentConfig } from './instrumentsConfig';
defineOptions({ name: 'DsModelBox' });
const props = defineProps({
    model: {
        default: 'Xiao',
        type: String
    }
});
// === 存储事件字典 ===
const eventMap = ref({});
// === 暴露 API ===
function toggleEmission(id, on) {
    const event = eventMap.value[id];
    if (!event || event.type !== 'emission')
        return;
    const mat = event.mesh.material;
    mat.emissive = new THREE.Color(0xffff00); // 可改为配置项
    mat.emissiveIntensity = on ? event.value : 0;
}
const __VLS_exposed = {
    toggleEmission,
    eventMap
};
defineExpose(__VLS_exposed);
const containerRef = ref(null);
onMounted(() => {
    if (!containerRef.value)
        return;
    // === 根据 props.model 获取配置 ===
    const config = instrumentConfig[props.model];
    if (!config) {
        console.error(`未找到模型配置: ${props.model}`);
        return;
    }
    const { scene, camera, renderer, controls } = config.setupScene(containerRef.value);
    // === 加载 GLB 模型 ===
    const loader = new GLTFLoader();
    loader.load(xiaoModel, // TODO 以后根据 model 动态加载
    (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                // 识别事件物体
                if (child.name.startsWith('event_')) {
                    const parts = child.name.split('_'); // [event, emission, 20, hole1]
                    if (parts.length >= 4) {
                        const [, type, valueStr, id] = parts;
                        const value = parseFloat(valueStr) || 0;
                        eventMap.value[id] = { type, value, mesh: child };
                        // console.log(`注册事件: ${id}`, eventMap.value[id])
                    }
                }
            }
        });
        scene.add(gltf.scene);
    }, undefined, (error) => console.error('加载模型出错:', error));
    // === 动画循环 ===
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();
    // === 窗口缩放 ===
    window.addEventListener('resize', () => {
        if (!containerRef.value)
            return;
        camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    });
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "containerRef",
    ...{ style: {} },
});
/** @type {typeof __VLS_ctx.containerRef} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            containerRef: containerRef,
        };
    },
    props: {
        model: {
            default: 'Xiao',
            type: String
        }
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    props: {
        model: {
            default: 'Xiao',
            type: String
        }
    },
});
; /* PartiallyEnd: #4569/main.vue */
