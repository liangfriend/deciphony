import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { KeyCodeEnum } from "../../types/enum";
defineOptions({
    name: 'DsKeyboard'
});
const props = defineProps({
    width: { type: String, default: '100%' },
    height: { type: String, default: '100%' },
    highlightStyle: {
        type: Object,
        default: () => ({
            backgroundColor: '#42b983',
            color: '#fff',
        })
    },
    config: {
        type: Array,
        default: () => ([])
    }
});
// 外部传入配置
function applyConfigToKeyList(list, configMap) {
    list.forEach(key => {
        const cfg = configMap.get(key.code);
        if (cfg) {
            if (cfg.showText !== undefined)
                key.showText = cfg.showText;
            if (cfg.fontSize !== undefined)
                key.fontSize = cfg.fontSize;
        }
    });
}
watch(() => props.config, (newConfig) => {
    if (!newConfig || newConfig.length === 0)
        return;
    // 🔸 转成 Map，方便查找
    const configMap = new Map();
    newConfig.forEach(cfg => configMap.set(cfg.code, cfg));
    // 🔸 把配置覆盖到每个按键数组
    applyConfigToKeyList(mainList.value, configMap);
    applyConfigToKeyList(escList.value, configMap);
    applyConfigToKeyList(f1List.value, configMap);
    applyConfigToKeyList(f5List.value, configMap);
    applyConfigToKeyList(f9List.value, configMap);
    applyConfigToKeyList(prtScList.value, configMap);
    applyConfigToKeyList(funcList.value, configMap);
    applyConfigToKeyList(numberLeftList.value, configMap);
    applyConfigToKeyList(numberRightList.value, configMap);
    applyConfigToKeyList(directionList.value, configMap);
}, { deep: true });
const emit = defineEmits(['keyDown', 'keyUp']);
// 当前被按下的 code 集合
const activeCodes = ref(new Set());
// 监听键盘按下
const handleKeyDown = (e) => {
    if (!activeCodes.value.has(e.code)) {
        activeCodes.value.add(e.code);
        emit('keyDown', e.code);
    }
};
// 监听键盘抬起
const handleKeyUp = (e) => {
    if (activeCodes.value.has(e.code)) {
        activeCodes.value.delete(e.code);
        emit('keyUp', e.code);
    }
};
onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
});
onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});
const keyboardContainerStyle = computed(() => {
    return {
        width: props.width,
        height: props.height
    };
});
const keyStyle = computed(() => (item) => {
    const isActive = activeCodes.value.has(item.code);
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
    };
});
const escList = ref([{
        code: KeyCodeEnum.Escape,
        text: 'esc',
        showText: '', fontSize: '',
        width: '81.8181818181818%',
        height: '81.8181818181818%',
        margin: ''
    }]);
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
    }]);
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
    }]);
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
    }]);
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
]);
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
]);
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
]);
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
]);
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
]);
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
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['keyboard-container']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "keyboard-container" },
    ...{ style: (__VLS_ctx.keyboardContainerStyle) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "esc" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.escList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "f1-4" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.f1List))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "f5-8" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.f5List))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "f9-12" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.f9List))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pr-sc-ps" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.prtScList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "media" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "main" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.mainList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "func" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.funcList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "number" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "numberLeft" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.numberLeftList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "numberRight" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.numberRightList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "direction" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.directionList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.keyStyle(item)) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (item.showText || item.text) }, null, null);
}
/** @type {__VLS_StyleScopedClasses['keyboard-container']} */ ;
/** @type {__VLS_StyleScopedClasses['esc']} */ ;
/** @type {__VLS_StyleScopedClasses['f1-4']} */ ;
/** @type {__VLS_StyleScopedClasses['f5-8']} */ ;
/** @type {__VLS_StyleScopedClasses['f9-12']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-sc-ps']} */ ;
/** @type {__VLS_StyleScopedClasses['media']} */ ;
/** @type {__VLS_StyleScopedClasses['main']} */ ;
/** @type {__VLS_StyleScopedClasses['func']} */ ;
/** @type {__VLS_StyleScopedClasses['number']} */ ;
/** @type {__VLS_StyleScopedClasses['numberLeft']} */ ;
/** @type {__VLS_StyleScopedClasses['numberRight']} */ ;
/** @type {__VLS_StyleScopedClasses['direction']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            keyboardContainerStyle: keyboardContainerStyle,
            keyStyle: keyStyle,
            escList: escList,
            f1List: f1List,
            f5List: f5List,
            f9List: f9List,
            prtScList: prtScList,
            funcList: funcList,
            numberLeftList: numberLeftList,
            numberRightList: numberRightList,
            directionList: directionList,
            mainList: mainList,
        };
    },
    emits: {},
    props: {
        width: { type: String, default: '100%' },
        height: { type: String, default: '100%' },
        highlightStyle: {
            type: Object,
            default: () => ({
                backgroundColor: '#42b983',
                color: '#fff',
            })
        },
        config: {
            type: Array,
            default: () => ([])
        }
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {
        width: { type: String, default: '100%' },
        height: { type: String, default: '100%' },
        highlightStyle: {
            type: Object,
            default: () => ({
                backgroundColor: '#42b983',
                color: '#fff',
            })
        },
        config: {
            type: Array,
            default: () => ([])
        }
    },
});
; /* PartiallyEnd: #4569/main.vue */
