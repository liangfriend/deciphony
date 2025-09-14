<script setup lang="ts">
import {onMounted, PropType, ref} from 'vue'
import xiaoModel from "@assets/models/xiao.glb"
import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {instrumentConfig} from './instrumentsConfig'

defineOptions({name: 'DsModelBox'})

const props = defineProps({
  model: {
    default: 'Xiao',
    type: String
  }
})

// === 存储事件字典 ===
const eventMap = ref<Record<string, {
  type: string,
  value: number,
  mesh: THREE.Mesh
}>>({})

// === 暴露 API ===
function toggleEmission(id: string, on: boolean) {
  const event = eventMap.value[id]
  if (!event || event.type !== 'emission') return

  const mat = event.mesh.material as THREE.MeshStandardMaterial
  mat.emissive = new THREE.Color(0xffff00) // 可改为配置项
  mat.emissiveIntensity = on ? event.value : 0
}

defineExpose({
  toggleEmission,
  eventMap
})

const containerRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (!containerRef.value) return

  // === 根据 props.model 获取配置 ===
  const config = instrumentConfig[props.model]
  if (!config) {
    console.error(`未找到模型配置: ${props.model}`)
    return
  }

  const {scene, camera, renderer, controls} = config.setupScene(containerRef.value)

  // === 加载 GLB 模型 ===
  const loader = new GLTFLoader()
  loader.load(
      xiaoModel, // TODO 以后根据 model 动态加载
      (gltf) => {
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.material = child.material.clone()

            // 识别事件物体
            if (child.name.startsWith('event_')) {
              const parts = child.name.split('_') // [event, emission, 20, hole1]
              if (parts.length >= 4) {
                const [, type, valueStr, id] = parts
                const value = parseFloat(valueStr) || 0
                eventMap.value[id] = {type, value, mesh: child}
                // console.log(`注册事件: ${id}`, eventMap.value[id])
              }
            }
          }
        })
        scene.add(gltf.scene)
      },
      undefined,
      (error) => console.error('加载模型出错:', error)
  )

  // === 动画循环 ===
  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // === 窗口缩放 ===
  window.addEventListener('resize', () => {
    if (!containerRef.value) return
    camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  })
})
</script>

<template>
  <div ref="containerRef" style="width:100%; height:100%;"></div>
</template>
