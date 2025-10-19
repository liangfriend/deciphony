<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount, computed, CSSProperties, PropType, watch} from 'vue'
import {KeyCodeEnum} from "../../types/enum";

defineOptions({
  name: 'DsKeyboard'
});
const props = defineProps({
  width: {type: String, default: '100%'},
  height: {type: String, default: '100%'},
  highlightStyle: { // 🔸 外部可传高亮样式
    type: Object as () => CSSProperties,
    default: () => ({
      backgroundColor: '#42b983',
      color: '#fff',
    })
  },
  config: {
    type: Array as PropType<{
      code: KeyCodeEnum,
      showText?: string,
      fontSize?: string,
    }[]>,
    default: () => ([])
  }
})

// 外部传入配置
function applyConfigToKeyList(list: any[], configMap: Map<KeyCodeEnum, any>) {
  list.forEach(key => {
    const cfg = configMap.get(key.code)
    if (cfg) {
      if (cfg.showText !== undefined) key.showText = cfg.showText
      if (cfg.fontSize !== undefined) key.fontSize = cfg.fontSize
    }
  })
}

watch(
    () => props.config,
    (newConfig) => {
      if (!newConfig || newConfig.length === 0) return

      // 🔸 转成 Map，方便查找
      const configMap = new Map<KeyCodeEnum, any>()
      newConfig.forEach(cfg => configMap.set(cfg.code, cfg))

      // 🔸 把配置覆盖到每个按键数组
      applyConfigToKeyList(mainList.value, configMap)
      applyConfigToKeyList(escList.value, configMap)
      applyConfigToKeyList(f1List.value, configMap)
      applyConfigToKeyList(f5List.value, configMap)
      applyConfigToKeyList(f9List.value, configMap)
      applyConfigToKeyList(prtScList.value, configMap)
      applyConfigToKeyList(funcList.value, configMap)
      applyConfigToKeyList(numberLeftList.value, configMap)
      applyConfigToKeyList(numberRightList.value, configMap)
      applyConfigToKeyList(directionList.value, configMap)
    },
    {deep: true}
)

const emit = defineEmits(['keyDown', 'keyUp'])
// 当前被按下的 code 集合
const activeCodes = ref<Set<string>>(new Set())
// 监听键盘按下
const handleKeyDown = (e: KeyboardEvent) => {
  if (!activeCodes.value.has(e.code)) {
    activeCodes.value.add(e.code)
    emit('keyDown', e.code)
  }
}

// 监听键盘抬起
const handleKeyUp = (e: KeyboardEvent) => {
  if (activeCodes.value.has(e.code)) {
    activeCodes.value.delete(e.code)
    emit('keyUp', e.code)
  }
}
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
const keyboardContainerStyle = computed((): CSSProperties => {
  return {
    width: props.width,
    height: props.height
  }
})
const keyStyle = computed(() => (item: any): CSSProperties => {
  const isActive = activeCodes.value.has(item.code)
  return {
    width: item.width,
    height: item.height,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    outline: !item.empty ? '0.5px solid black' : '',
    margin: item.margin,
    flexShrink: 0,
    fontSize: item.fontSize,
    flexGrow: 0,
    transition: 'all 0.1s ease',
    ...(isActive ? props.highlightStyle : {})
  }
})
const escList = ref([{
  code: KeyCodeEnum.Escape,
  text: 'esc',
  showText: '', fontSize: '',
  width: '81.8181818181818%',
  height: '81.8181818181818%',
  margin: ''
}])
const f1List = ref([{
  code: KeyCodeEnum.F1,
  text: 'f1',
  showText: '', fontSize: '',
  width: '17.64705882352%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.45098039215%'
}, {
  code: KeyCodeEnum.F2,
  text: 'f2',
  width: '17.64705882352%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.45098039215%'
}, {
  code: KeyCodeEnum.F3,
  text: 'f3',
  showText: '', fontSize: '',
  width: '17.64705882352%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.45098039215%'
}, {
  code: KeyCodeEnum.F4,
  text: 'f4',
  showText: '', fontSize: '',
  width: '17.64705882352%',
  height: '81.8181818181818%',
  margin: '0 2.45098039215% 0 2.45098039215%'
}])
const f5List = ref([{
  code: KeyCodeEnum.F5,
  text: 'f5',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.71739130434%'
}, {
  code: KeyCodeEnum.F6,
  text: 'f6',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.71739130434%'
}, {
  code: KeyCodeEnum.F7,
  text: 'f7',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.71739130434%'
}, {
  code: KeyCodeEnum.F8,
  text: 'f8',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 2.71739130434% 0 2.71739130434%'
}])
const f9List = ref([{
  code: KeyCodeEnum.F9,
  text: 'f9',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.71739130434%'
}, {
  code: KeyCodeEnum.F10,
  text: 'f10',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.71739130434%'
}, {
  code: KeyCodeEnum.F11,
  text: 'f11',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 0 0 2.71739130434%'
}, {
  code: KeyCodeEnum.F12,
  text: 'f12',
  showText: '', fontSize: '',
  width: '19.35483870967%',
  height: '81.8181818181818%',
  margin: '0 2.71739130434% 0 2.71739130434%'
}])
const prtScList = ref([
  {
    code: KeyCodeEnum.PrintScreen, text: 'PR',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '81.8181818181818%',
  },
  {
    code: KeyCodeEnum.ScrollLock, text: 'SC',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '81.8181818181818%',
  },
  {
    code: KeyCodeEnum.Pause, text: 'PS',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '81.8181818181818%',
  }
])

const funcList = ref([
  {
    code: KeyCodeEnum.Insert, text: 'Ins',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '41.86046511627%',
  },
  {
    code: KeyCodeEnum.Home, text: 'ho',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '41.86046511627%',
  },
  {
    code: KeyCodeEnum.PageUp, text: 'pu',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '41.86046511627%',
  },
  {
    code: KeyCodeEnum.Delete, text: 'del',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '41.86046511627%',
  },
  {
    code: KeyCodeEnum.End, text: 'end',
    showText: '', fontSize: '',
    width: '28.125%',
    height: '41.86046511627%',
  },
  {
    code: KeyCodeEnum.PageDown, text: 'pd', showText: '', fontSize: '',
    width: '28.125%',
    height: '41.86046511627%',
  }
])
const numberLeftList = ref([
  {
    code: KeyCodeEnum.NumLock, text: 'num', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.NumpadDivide, text: '/', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.NumpadMultiply, text: '*', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad7, text: '7', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad8, text: '8', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad9, text: '9', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },

  {
    code: KeyCodeEnum.Numpad4, text: '4', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad5, text: '5', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad6, text: '6', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad1, text: '1', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad2, text: '2', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad3, text: '3', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.Numpad0, text: '0', showText: '', fontSize: '',
    width: '61.1111111111%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.NumpadDecimal, text: '.', showText: '', fontSize: '',
    width: '28.57142857142%',
    height: '16.98113207547%',
  }
])
const numberRightList = ref([
  {
    code: KeyCodeEnum.NumpadSubtract, text: '-', showText: '', fontSize: '',
    width: '85.71428571428%',
    height: '16.98113207547%',
  },
  {
    code: KeyCodeEnum.NumpadAdd, text: '+', showText: '', fontSize: '',
    width: '85.71428571428%',
    height: '36.47798742138%',
  },
  {
    code: KeyCodeEnum.NumpadEnter, text: 'Enter', showText: '', fontSize: '0.7rem',
    width: '85.71428571428%',
    height: '36.47798742138%',
  },
])
const directionList = ref([
  {
    code: -1, text: '', empty: true, showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: -1, text: '', empty: true, showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: -1, text: '', empty: true, showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: -1, text: '', empty: true, showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: KeyCodeEnum.ArrowUp, text: '↑', showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: -1, text: '', empty: true, showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: KeyCodeEnum.ArrowLeft, text: '←', showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },
  {
    code: KeyCodeEnum.ArrowDown, text: '↓', showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  },

  {
    code: KeyCodeEnum.ArrowRight, text: '→', showText: '', fontSize: '',
    width: '28.125%',
    height: '28.57142857142%',
    margin: '0 0 3.90625% 3.90625%',
  }
])
const mainList = ref([
  {
    code: KeyCodeEnum.Backquote,
    text: '`', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit1,
    text: '1', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit2,
    text: '2', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit3,
    text: '3', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit4,
    text: '4', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit5,
    text: '5', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit6,
    text: '6', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit7,
    text: '7', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit8,
    text: '8', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit9,
    text: '9', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Digit0,
    text: '0', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Minus,
    text: '-', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Equal,
    text: '=', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Backspace,
    text: 'Backspace', showText: '', fontSize: '0.7rem',
    width: '12.30221518987%',
    height: '16.98113207547%',
    margin: '0.90981012658% 0 0 0.90981012658%'
  },

  {
    code: KeyCodeEnum.Tab,
    text: 'Tab', showText: '', fontSize: '',
    width: '8.99920886075%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyQ,
    text: 'Q', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyW,
    text: 'W', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyE,
    text: 'E', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyR,
    text: 'R', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyT,
    text: 'T', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyY,
    text: 'Y', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyU,
    text: 'U', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyI,
    text: 'I', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyO,
    text: 'O', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyP,
    text: 'P', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.BracketLeft,
    text: '[', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.BracketRight,
    text: ']', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Backslash,
    text: '\\', showText: '', fontSize: '',
    width: '8.99920886075%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },

  {
    code: KeyCodeEnum.CapsLock,
    text: 'Caps', showText: '', fontSize: '',
    width: '9.84177215189%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyA,
    text: 'A', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyS,
    text: 'S', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyD,
    text: 'D', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyF,
    text: 'F', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyG,
    text: 'G', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyH,
    text: 'H', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyJ,
    text: 'J', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyK,
    text: 'K', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyL,
    text: 'L', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Semicolon,
    text: ';', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Quote,
    text: '\'', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Enter,
    text: 'Enter', showText: '', fontSize: '',
    width: '14.76265822784%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },

  {
    code: KeyCodeEnum.ShiftLeft,
    text: 'Shift', showText: '', fontSize: '',
    width: '12.48417721518%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyZ,
    text: 'Z', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyX,
    text: 'X', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyC,
    text: 'C', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyV,
    text: 'V', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyB,
    text: 'B', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyN,
    text: 'N', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.KeyM,
    text: 'M', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Comma,
    text: ',', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Period,
    text: '.', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Slash,
    text: '/', showText: '', fontSize: '',
    width: '5.69620253164%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.ShiftRight,
    text: 'Shift', showText: '', fontSize: '',
    width: '18.73101265822%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },

  {
    code: KeyCodeEnum.ControlLeft,
    text: 'Ctrl', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.MetaLeft,
    text: 'Win', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.AltLeft,
    text: 'Alt', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.Space,
    text: 'Space', showText: '', fontSize: '',
    width: '43.96360759493%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.AltRight,
    text: 'Alt', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.MetaRight,
    text: 'Fn', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.ContextMenu,
    text: 'Menu', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  },
  {
    code: KeyCodeEnum.ControlRight,
    text: 'Ctrl', showText: '', fontSize: '',
    width: '6.83544303797%',
    height: '16.98113207547%',
    margin: '0 0 0 0.90981012658%'
  }
])
</script>

<template>
  <div class="keyboard-container" :style="keyboardContainerStyle">
    <div class="esc">
      <div v-for="item in escList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="f1-4">
      <div v-for="item in f1List" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="f5-8">
      <div v-for="item in f5List" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="f9-12">
      <div v-for="item in f9List" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="pr-sc-ps">
      <div v-for="item in prtScList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="media">Media</div>

    <div class="main">
      <div v-for="item in mainList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="func">
      <div v-for="item in funcList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
    <div class="number">
      <div class="numberLeft">
        <div v-for="item in numberLeftList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
      </div>
      <div class="numberRight">
        <div v-for="item in numberRightList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
      </div>

    </div>

    <div class="direction">
      <div v-for="item in directionList" :style="keyStyle(item)" v-html="item.showText || item.text"></div>
    </div>
  </div>
</template>

<style scoped>

.keyboard-container {
  display: grid;
  /* padding margin这些都是按照宽度来计算的 */
  padding: 2.13219616204% 1.06609808102%;
  grid-template-columns: 4.69083155650% 21.74840085287% 19.82942430703% 19.82942430703% 13.64605543710% 18.12366737739%;
  grid-template-rows: 16.92307692307% 33.07692307692% 46.92307692307%;
  grid-template-areas:
    "esc f1-4 f5-8 f9-12 pr-sc-ps media"
    "main main main main func     number"
    "main main main main direction number";
  /* 第一个是按照高度来计算的，第二个是按照宽度来计算的*/
  gap: 1.53846153846% 0.42643923240%;
  background: #1e1e1e;
  border-radius: 10px;
}

/* 统一样式 */
.keyboard-container > div {
  background: #333;
  color: #fff;
  border-radius: 5px;
  font-size: 14px;
}

.esc {
  grid-area: esc;
  display: flex;
  justify-content: center;
  align-items: center;
}

.f1-4 {
  grid-area: f1-4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.f5-8 {
  grid-area: f5-8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.f9-12 {
  grid-area: f9-12;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.pr-sc-ps {
  grid-area: pr-sc-ps;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}

.media {
  grid-area: media;
}

.main {
  grid-area: main;
  display: flex;
  flex-wrap: wrap;

}

.func {
  grid-area: func;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-content: space-evenly;
}

.number {
  grid-area: number;
  display: flex;
}

.numberLeft {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-content: space-evenly;
  width: 75.29411764705%;
  flex-shrink: 0;
  flex-grow: 0;
}

.numberRight {
  display: flex;
  flex-wrap: wrap;
  width: 24.70588235294%;
  flex-shrink: 0;
  flex-grow: 0;
  align-content: space-evenly;
}

.direction {
  grid-area: direction;
  display: flex;
  flex-wrap: wrap;
}


</style>
