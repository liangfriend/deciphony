<script lang="ts" setup>
import MusicScoreVue from '@deciphony/renderer'
import type {DrExtension, MusicScore, Skin, VDom} from '@deciphony/renderer'
import {
  AmbientLight,
  Box3,
  BoxGeometry,
  Color,
  DirectionalLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {toSingleLineMusicScore} from '../singleLine'
import {buildScoreObject3D, type ScoreObject3D, type TextTextureCache} from '../svgToObject3D'
import type {
  Score3DBounds,
  Score3DCameraOptions,
  Score3DCameraState,
  Score3DControlsOptions,
  Score3DExpose,
  Score3DPaperOptions,
  Score3DTransitionOptions,
  Score3DVector,
  SingleLineOptions,
} from '../types'

defineOptions({name: 'Score3D'})

const props = withDefaults(defineProps<{
  musicScore: MusicScore
  skin?: Skin
  skinName?: string
  /** 只建议放展示类扩展（dr-title / dr-lyrics / dr-mark 等），它们画进插槽的 svg 也会转成 3D */
  extensions?: DrExtension[]
  /** 是否先转成单行复谱表，默认 true */
  singleLine?: boolean
  singleLineOptions?: SingleLineOptions
  /** 世界背景色 */
  background?: string
  /** 初始视角；变化时会过渡过去 */
  camera?: Score3DCameraOptions
  /** false 关闭拖动视角 */
  controls?: boolean | Score3DControlsOptions
  /** 符号挤出厚度（px），0 = 平面 */
  depth?: number
  /** 统一覆盖符号颜色 */
  color?: string
  /** 曲谱背后的纸张；false 不显示 */
  paper?: boolean | Score3DPaperOptions
  /** 文字贴图每 px 的像素数 */
  textResolution?: number
}>(), {
  singleLine: true,
  background: '#1f2228',
  controls: true,
  depth: 2,
  paper: true,
  textResolution: 3,
})

const emit = defineEmits<{
  /** 每次从曲谱 svg 重新生成 3D 网格后触发 */
  built: [bounds: Score3DBounds]
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const canvasHostRef = ref<HTMLDivElement | null>(null)
const sourceRef = ref<HTMLDivElement | null>(null)

const lineScore = computed<MusicScore>(() => props.singleLine
  ? toSingleLineMusicScore(props.musicScore, props.singleLineOptions)
  : JSON.parse(JSON.stringify(props.musicScore)))
/** 按实际 vDom 底边撑开的高度，避免底部插槽被裁 */
const fittedHeight = ref<number | null>(null)
const sourceScore = computed<MusicScore>(() => fittedHeight.value == null
  ? lineScore.value
  : {...lineScore.value, height: fittedHeight.value})
watch(lineScore, () => (fittedHeight.value = null))

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let scoreObject: ScoreObject3D | null = null
let paperMesh: Mesh | null = null
let bounds: Box3 | null = null
let cameraReady = false
let needsRender = true
let rafId = 0
let buildRaf = 0
let resizeObserver: ResizeObserver | null = null
const textureCache: TextTextureCache = new Map()

type Tween = {
  fromPos: Vector3
  toPos: Vector3
  fromTarget: Vector3
  toTarget: Vector3
  fromFov: number
  toFov: number
  start: number
  duration: number
}
let tween: Tween | null = null

/** 内联样式：宿主不引入 @deciphony/extensions/css 也要能用 */
const ROOT_STYLE = 'position:relative;width:100%;height:100%;min-height:200px;overflow:hidden'
const CANVAS_STYLE = 'position:absolute;inset:0'
/** 源 svg 需要真实布局（getScreenCTM / getBBox），只是不可见 */
const SOURCE_STYLE = 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-1'

const DEFAULT_FOV = 45
const DEFAULT_TRANSITION = 600
/** 默认从左前方略高处看，整行向右延伸到远处 */
const VIEW_DIRECTION = new Vector3(-0.55, 0.2, 1).normalize()

const requestRender = () => {
  needsRender = true
}

const toVec = (v: Vector3): Score3DVector => ({x: v.x, y: v.y, z: v.z})

function paperOptions(): Required<Score3DPaperOptions> | null {
  if (props.paper === false) return null
  const opt = props.paper === true ? {} : props.paper
  return {color: opt.color ?? '#ffffff', padding: opt.padding ?? 24, thickness: opt.thickness ?? 4}
}

function controlsOptions(): Score3DControlsOptions {
  if (props.controls === false) return {enabled: false}
  return props.controls === true ? {} : props.controls
}

function applyControls(options: Score3DControlsOptions) {
  if (!controls) return
  const target = controls as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(options)) {
    if (v !== undefined) target[k] = v
  }
  requestRender()
}

function rebuildPaper() {
  if (paperMesh) {
    paperMesh.geometry.dispose()
    ;(paperMesh.material as MeshStandardMaterial).dispose()
    paperMesh.removeFromParent()
    paperMesh = null
  }
  const opt = paperOptions()
  if (!opt || !bounds || bounds.isEmpty() || !scene) return
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  const geometry = new BoxGeometry(size.x + opt.padding * 2, size.y + opt.padding * 2, opt.thickness)
  paperMesh = new Mesh(geometry, new MeshStandardMaterial({color: opt.color, roughness: 0.9, metalness: 0}))
  paperMesh.name = 'dr-score3d-paper'
  paperMesh.position.set(center.x, center.y, -0.5 - opt.thickness / 2)
  paperMesh.renderOrder = -1
  scene.add(paperMesh)
  requestRender()
}

/** 自动斜视角：看向曲谱开头约 4 个谱高宽的区域，props.camera 覆盖在其上 */
function defaultCamera(): Score3DCameraState {
  const fov = props.camera?.fov ?? DEFAULT_FOV
  const box = bounds && !bounds.isEmpty() ? bounds : new Box3(new Vector3(0, -300, 0), new Vector3(1000, 0, 0))
  const size = box.getSize(new Vector3())
  const span = Math.min(size.x, Math.max(size.y * 4, 800))
  const target = new Vector3(box.min.x + span * 0.55, (box.min.y + box.max.y) / 2, 0)
  const aspect = camera?.aspect ?? 1.6
  const fitW = span / 2 / Math.tan(MathUtils.degToRad(fov) / 2) / aspect
  const fitH = size.y / 2 / Math.tan(MathUtils.degToRad(fov) / 2)
  // 斜视时靠近相机的开头会放大，多留余量
  const distance = Math.max(fitW, fitH) * 1.6
  const position = target.clone().addScaledVector(VIEW_DIRECTION, distance)
  const far = Math.max(1e5, size.x * 4)
  return {
    position: props.camera?.position ?? toVec(position),
    target: props.camera?.target ?? toVec(target),
    fov,
    near: props.camera?.near ?? 1,
    far: props.camera?.far ?? far,
  }
}

function getCamera(): Score3DCameraState {
  if (!camera || !controls) return defaultCamera()
  return {
    position: toVec(camera.position),
    target: toVec(controls.target),
    fov: camera.fov,
    near: camera.near,
    far: camera.far,
  }
}

function setCamera(options: Score3DCameraOptions, transition: Score3DTransitionOptions = {}) {
  if (!camera || !controls) return
  if (options.near != null) camera.near = options.near
  if (options.far != null) camera.far = options.far
  const toPos = options.position ? new Vector3(options.position.x, options.position.y, options.position.z) : camera.position.clone()
  const toTarget = options.target ? new Vector3(options.target.x, options.target.y, options.target.z) : controls.target.clone()
  const toFov = options.fov ?? camera.fov
  const duration = transition.duration ?? 0
  if (duration <= 0) {
    tween = null
    camera.position.copy(toPos)
    controls.target.copy(toTarget)
    camera.fov = toFov
    camera.updateProjectionMatrix()
    controls.update()
    requestRender()
    return
  }
  tween = {
    fromPos: camera.position.clone(),
    toPos,
    fromTarget: controls.target.clone(),
    toTarget,
    fromFov: camera.fov,
    toFov,
    start: performance.now(),
    duration,
  }
  camera.updateProjectionMatrix()
  requestRender()
}

function resetCamera(transition: Score3DTransitionOptions = {}) {
  setCamera(defaultCamera(), transition)
}

function fitView(options: Score3DTransitionOptions & {padding?: number} = {}) {
  if (!camera || !bounds || bounds.isEmpty()) return
  const padding = options.padding ?? 1.1
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  const half = Math.tan(MathUtils.degToRad(camera.fov) / 2)
  const distance = Math.max(size.y / 2 / half, size.x / 2 / half / camera.aspect) * padding
  setCamera({target: toVec(center), position: {x: center.x, y: center.y, z: distance}}, options)
  if (camera.far < distance * 2) {
    camera.far = distance * 4
    camera.updateProjectionMatrix()
  }
}

function focusX(x: number, transition: Score3DTransitionOptions = {}) {
  if (!camera || !controls) return
  const offset = camera.position.clone().sub(controls.target)
  const target = controls.target.clone().setX(x)
  setCamera({target: toVec(target), position: toVec(target.clone().add(offset))}, transition)
}

function setBackground(color: string) {
  if (!scene) return
  scene.background = new Color(color)
  requestRender()
}

function scoreToWorld(x: number, y: number, z = 0): Score3DVector {
  return {x, y: -y, z}
}

function getBounds(): Score3DBounds | null {
  if (!bounds || bounds.isEmpty()) return null
  return {min: toVec(bounds.min), max: toVec(bounds.max)}
}

function pruneTextures(used: Set<string>) {
  for (const [key, entry] of textureCache) {
    if (used.has(key)) continue
    if (entry.texture) entry.texture.dispose()
    else entry.promise.then((tex) => tex?.dispose())
    textureCache.delete(key)
  }
}

function build() {
  const svg = sourceRef.value?.querySelector('svg')
  if (!svg || !scene || !renderer) return
  const next = buildScoreObject3D(svg, {
    depth: props.depth,
    color: props.color,
    textResolution: props.textResolution,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    textureCache,
    onTextureLoad: requestRender,
  })
  scoreObject?.dispose()
  scoreObject = next
  scene.add(next.group)
  pruneTextures(next.textureKeys)
  next.group.updateMatrixWorld(true)
  bounds = new Box3().setFromObject(next.group)
  rebuildPaper()
  if (!cameraReady) {
    cameraReady = true
    resetCamera()
  }
  requestRender()
  const b = getBounds()
  if (b) emit('built', b)
}

function scheduleBuild() {
  cancelAnimationFrame(buildRaf)
  buildRaf = requestAnimationFrame(() => nextTick(build))
}

function onSourceRender(list: VDom[]) {
  const bottom = Math.ceil(Math.max(0, ...list.map((n) => n.y + n.h))) + 20
  if (Math.abs(bottom - sourceScore.value.height) > 1) fittedHeight.value = bottom
  scheduleBuild()
}

function resize() {
  const host = canvasHostRef.value
  if (!host || !renderer || !camera) return
  const w = Math.max(1, host.clientWidth)
  const h = Math.max(1, host.clientHeight)
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  requestRender()
}

function stepTween(now: number) {
  if (!tween || !camera || !controls) return
  const t = Math.min(1, (now - tween.start) / tween.duration)
  const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  camera.position.lerpVectors(tween.fromPos, tween.toPos, k)
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k)
  camera.fov = tween.fromFov + (tween.toFov - tween.fromFov) * k
  camera.updateProjectionMatrix()
  if (t >= 1) tween = null
  needsRender = true
}

function loop(now: number) {
  rafId = requestAnimationFrame(loop)
  stepTween(now)
  const moved = controls?.update() ?? false
  if ((needsRender || moved) && renderer && scene && camera) {
    renderer.render(scene, camera)
    needsRender = false
  }
}

function toDataURL(type?: string, quality?: number): string {
  if (!renderer || !scene || !camera) return ''
  renderer.render(scene, camera)
  return renderer.domElement.toDataURL(type, quality)
}

onMounted(() => {
  const host = canvasHostRef.value!
  renderer = new WebGLRenderer({antialias: true, logarithmicDepthBuffer: true})
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  host.appendChild(renderer.domElement)

  scene = new Scene()
  scene.background = new Color(props.background)
  camera = new PerspectiveCamera(props.camera?.fov ?? DEFAULT_FOV, 1, 1, 1e5)
  scene.add(camera)
  scene.add(new AmbientLight(0xffffff, 1.4))
  const keyLight = new DirectionalLight(0xffffff, 1.8)
  keyLight.position.set(0.4, 0.8, 1)
  const keyTarget = new Object3D()
  keyTarget.position.set(0, 0, -1)
  camera.add(keyLight, keyTarget)
  keyLight.target = keyTarget

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.screenSpacePanning = true
  controls.addEventListener('change', requestRender)
  applyControls(controlsOptions())

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()
  rafId = requestAnimationFrame(loop)
  scheduleBuild()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  cancelAnimationFrame(buildRaf)
  resizeObserver?.disconnect()
  controls?.dispose()
  scoreObject?.dispose()
  if (paperMesh) {
    paperMesh.geometry.dispose()
    ;(paperMesh.material as MeshStandardMaterial).dispose()
  }
  pruneTextures(new Set())
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
  scene = null
  camera = null
  controls = null
  scoreObject = null
  paperMesh = null
})

watch(() => props.background, (c) => setBackground(c))
watch(() => props.controls, () => applyControls({enabled: true, ...controlsOptions()}), {deep: true})
watch(() => props.paper, rebuildPaper, {deep: true})
watch(() => [props.depth, props.color, props.textResolution], scheduleBuild)
watch(() => props.camera, () => cameraReady && setCamera(defaultCamera(), {duration: DEFAULT_TRANSITION}), {deep: true})

const exposed: Score3DExpose = {
  setCamera,
  getCamera,
  resetCamera,
  fitView,
  focusX,
  setBackground,
  setControls: applyControls,
  scoreToWorld,
  getBounds,
  rebuild: scheduleBuild,
  toDataURL,
  getRenderer: () => renderer,
  getScene: () => scene,
  getThreeCamera: () => camera,
  getControls: () => controls,
}
defineExpose(exposed)
</script>

<template>
  <div ref="rootRef" :style="ROOT_STYLE" class="dr-score3d">
    <div ref="canvasHostRef" :style="CANVAS_STYLE" class="dr-score3d__canvas"/>
    <div ref="sourceRef" :style="SOURCE_STYLE" aria-hidden="true" class="dr-score3d__source">
      <MusicScoreVue
          :data="sourceScore"
          :extensions="extensions"
          :skin="skin"
          :skin-name="skinName"
          @render-music-score="onSourceRender"
      />
    </div>
  </div>
</template>