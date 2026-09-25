import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import playButton from '@assets/images/ds-video/play.png';
import pauseButton from '@assets/images/ds-video/pause.png';
import nextButton from '@assets/images/ds-video/next.png';
import back from '@assets/images/ds-video/back.png';
defineOptions({
    name: 'DsVideo' // 给组件一个全局 name
});
const props = defineProps({
    playButtonImg: { type: String, default: playButton },
    pauseButtonImg: { type: String, default: pauseButton },
    nextButtonImg: { type: String, default: nextButton },
    progressBgImg: {
        type: String,
        default: ''
    },
    startPlay: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    progressPlayedImg: {
        type: String,
        default: ''
    },
    progressThumbImg: {
        type: String,
        default: ''
    },
    placeholderImg: {
        type: String,
        default: ''
    }, // 没传时不展示
    controlsHeight: { type: String, default: '40px' },
    hidden: {
        type: Array,
        default: () => []
    },
    srcList: {
        type: Array,
        default: () => []
    }
});
const operationShow = ref(false); // 上下功能按钮区域
const rightModelShow = ref(false); // 左侧遮罩展示
const rightModelType = ref('rate'); // 'episode'
const videoAvailable = computed(() => {
    if (props.srcList?.length) {
        return true;
    }
    return false;
});
const rateList = ref([
    {
        title: '2.0X',
        value: 2
    },
    {
        title: '1.5X',
        value: 1.5
    },
    {
        title: '1.25X',
        value: 1.25
    },
    {
        title: '1.0X',
        value: 1
    },
    {
        title: '0.75X',
        value: 0.75
    },
    {
        title: '0.5X',
        value: 0.5
    }
]);
const curRateIndex = ref(3);
const srcListIndex = ref(0);
const videoRef = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progressPercent = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0);
const volume = ref(1);
// const playbackRate = ref(1);
function togglePlay() {
    if (!videoRef.value)
        return;
    if (videoRef.value.paused) {
        videoRef.value.play();
        isPlaying.value = true;
    }
    else {
        videoRef.value.pause();
        isPlaying.value = false;
    }
}
function updateProgress() {
    if (videoRef.value) {
        currentTime.value = videoRef.value.currentTime;
    }
}
function updateDuration() {
    if (videoRef.value) {
        duration.value = videoRef.value.duration;
    }
}
function seek(e) {
    if (!videoRef.value)
        return;
    const bar = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - bar.x;
    const percent = clickX / bar.width;
    videoRef.value.currentTime = percent * duration.value;
    currentTime.value = videoRef.value.currentTime;
}
function updateVolume() {
    if (videoRef.value) {
        videoRef.value.volume = volume.value;
    }
}
function changeSpeed() {
    if (videoRef.value) {
        //
    }
}
function toggleFullScreen() {
    const player = videoRef.value?.parentElement;
    if (!player)
        return;
    if (!document.fullscreenElement) {
        player.requestFullscreen?.();
    }
    else {
        document.exitFullscreen?.();
    }
}
function selectRate() {
    rightModelType.value = 'rate';
    rightModelShow.value = true;
}
function selectEpisode() {
    rightModelType.value = 'episode';
    rightModelShow.value = true;
}
function nextEpisode() {
    if (srcListIndex.value < props.srcList.length - 1) {
        changeEpisode(srcListIndex.value + 1);
    }
}
function changeEpisode(index) {
    srcListIndex.value = index;
    rightModelShow.value = false;
    curRateIndex.value = 3;
    videoRef.value.pause();
    setTimeout(() => {
        togglePlay();
    });
}
function changeRate(index) {
    if (!rateList.value[index]?.value || !videoRef.value) {
        return;
    }
    videoRef.value.playbackRate = rateList.value[index].value;
    curRateIndex.value = index;
    rightModelShow.value = false;
}
function videoMouseDown() {
    operationShow.value = !operationShow.value;
    rightModelShow.value = false;
}
// 拖动进度条
let dragging = false;
function startDrag() {
    dragging = true;
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', stopDrag);
}
function onDrag(e) {
    if (!dragging || !videoRef.value)
        return;
    const bar = document.querySelector('.progress-bar').getBoundingClientRect();
    const dragX = e.touches[0].clientX - bar.x;
    const percent = Math.max(0, Math.min(1, dragX / bar.width));
    videoRef.value.currentTime = percent * duration.value;
    currentTime.value = videoRef.value.currentTime;
}
function stopDrag() {
    dragging = false;
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
function onVideoEnded() {
    isPlaying.value = false;
}
const emits = defineEmits(['back']);
onMounted(() => {
    updateVolume();
    changeSpeed();
    if (props.startPlay) {
        togglePlay();
    }
});
onBeforeUnmount(() => {
    stopDrag();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ds-video" },
});
if (__VLS_ctx.videoAvailable) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.video)({
        ...{ onEnded: (__VLS_ctx.onVideoEnded) },
        ...{ onLoadedmetadata: (__VLS_ctx.updateDuration) },
        ...{ onPointerdown: (__VLS_ctx.videoMouseDown) },
        ...{ onTimeupdate: (__VLS_ctx.updateProgress) },
        ref: "videoRef",
        src: (__VLS_ctx.srcList?.[__VLS_ctx.srcListIndex]?.url),
        ...{ class: "video" },
        playsinline: true,
        'webkit-playsinline': true,
        'x-webkit-airplay': "allow",
        'x5-video-player-fullscreen': "false",
        'x5-video-player-type': "h5",
    });
    /** @type {typeof __VLS_ctx.videoRef} */ ;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ds-video-placeholder" },
    });
    if (__VLS_ctx.placeholderImg) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.placeholderImg),
            alt: "ds-video-placeholder",
            ...{ class: "ds-video-placeholder-img" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "ds-video-placeholder-default" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.operationShow) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-mask" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emits('back');
        } },
    ...{ class: "back" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: (__VLS_ctx.back),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "title" },
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: ({ disabled: !__VLS_ctx.videoAvailable }) },
    ...{ class: "ds-video-controls" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.operationShow) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ds-video-controls-mask" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "time-display" },
});
(__VLS_ctx.formatTime(__VLS_ctx.currentTime));
(__VLS_ctx.formatTime(__VLS_ctx.duration));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "middle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.seek($event);
        } },
    ...{ class: "progress-bar" },
});
if (props.progressBgImg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (props.progressBgImg),
        ...{ class: "progress-bg" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "progress-bg default-bg" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: `${__VLS_ctx.progressPercent}%` }) },
    ...{ class: "progress-played" },
});
if (props.progressPlayedImg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (props.progressPlayedImg),
        ...{ class: "progress-played-img" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "progress-played-img default-played" },
    });
}
if (props.progressThumbImg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onTouchstart: (__VLS_ctx.startDrag) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (props.progressThumbImg),
        ...{ style: ({ left: `${__VLS_ctx.progressPercent}%` }) },
        ...{ class: "thumb" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onTouchstart: (__VLS_ctx.startDrag) },
        ...{ style: ({ left: `${__VLS_ctx.progressPercent}%` }) },
        ...{ class: "thumb default-thumb" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "left" },
});
if ((props.playButtonImg && !__VLS_ctx.isPlaying) || (props.pauseButtonImg && __VLS_ctx.isPlaying)) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.togglePlay) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.isPlaying ? props.pauseButtonImg : props.playButtonImg),
        ...{ class: "btn play-btn" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.togglePlay) },
        ...{ class: "play-btn default-icon" },
    });
}
if ((props.playButtonImg && !__VLS_ctx.isPlaying) || (props.pauseButtonImg && __VLS_ctx.isPlaying)) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.nextEpisode) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (props.nextButtonImg),
        ...{ style: ({ marginLeft: '1rem' }) },
        ...{ class: "btn play-btn" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "right" },
});
if (!__VLS_ctx.hidden.includes('volume')) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (__VLS_ctx.updateVolume) },
        disabled: (!__VLS_ctx.videoAvailable),
        ...{ class: "volume rightButton" },
        max: "1",
        min: "0",
        step: "0.01",
        type: "range",
    });
    (__VLS_ctx.volume);
}
if (!__VLS_ctx.hidden.includes('rate')) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.selectRate) },
        ...{ class: "rightButton" },
    });
}
if (!__VLS_ctx.hidden.includes('episode')) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.selectEpisode) },
        ...{ class: "rightButton" },
    });
}
if (!__VLS_ctx.hidden.includes('fullscreen')) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.toggleFullScreen) },
        disabled: (!__VLS_ctx.videoAvailable),
        ...{ class: "rightButton" },
    });
}
if (__VLS_ctx.srcList) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ({ verticalCenter: __VLS_ctx.rightModelType === 'rate' }) },
        ...{ style: ({ width: __VLS_ctx.rightModelType === 'episode' ? '300px' : '150px' }) },
        ...{ class: "rightModel" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.rightModelShow) }, null, null);
    if (__VLS_ctx.rightModelType === 'episode') {
        for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.srcList))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.srcList))
                            return;
                        if (!(__VLS_ctx.rightModelType === 'episode'))
                            return;
                        __VLS_ctx.changeEpisode(index);
                    } },
                key: ('episode' + index),
                ...{ class: ({ active: index === __VLS_ctx.srcListIndex }) },
                ...{ class: "item" },
            });
            (item.title);
        }
    }
    if (__VLS_ctx.rightModelType === 'rate') {
        for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.rateList))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.srcList))
                            return;
                        if (!(__VLS_ctx.rightModelType === 'rate'))
                            return;
                        __VLS_ctx.changeRate(index);
                    } },
                key: ('rate' + index),
                ...{ class: ({ active: index === __VLS_ctx.curRateIndex }) },
                ...{ class: "item itemRate" },
            });
            (item.title);
        }
    }
}
/** @type {__VLS_StyleScopedClasses['ds-video']} */ ;
/** @type {__VLS_StyleScopedClasses['video']} */ ;
/** @type {__VLS_StyleScopedClasses['ds-video-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['ds-video-placeholder-img']} */ ;
/** @type {__VLS_StyleScopedClasses['ds-video-placeholder-default']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['back']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['ds-video-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['ds-video-controls-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['top']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['middle']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['default-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-played']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-played-img']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-played-img']} */ ;
/** @type {__VLS_StyleScopedClasses['default-played']} */ ;
/** @type {__VLS_StyleScopedClasses['thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['default-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['left']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['default-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['right']} */ ;
/** @type {__VLS_StyleScopedClasses['volume']} */ ;
/** @type {__VLS_StyleScopedClasses['rightButton']} */ ;
/** @type {__VLS_StyleScopedClasses['rightButton']} */ ;
/** @type {__VLS_StyleScopedClasses['rightButton']} */ ;
/** @type {__VLS_StyleScopedClasses['rightButton']} */ ;
/** @type {__VLS_StyleScopedClasses['rightModel']} */ ;
/** @type {__VLS_StyleScopedClasses['item']} */ ;
/** @type {__VLS_StyleScopedClasses['item']} */ ;
/** @type {__VLS_StyleScopedClasses['itemRate']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            back: back,
            operationShow: operationShow,
            rightModelShow: rightModelShow,
            rightModelType: rightModelType,
            videoAvailable: videoAvailable,
            rateList: rateList,
            curRateIndex: curRateIndex,
            srcListIndex: srcListIndex,
            videoRef: videoRef,
            isPlaying: isPlaying,
            currentTime: currentTime,
            duration: duration,
            progressPercent: progressPercent,
            volume: volume,
            togglePlay: togglePlay,
            updateProgress: updateProgress,
            updateDuration: updateDuration,
            seek: seek,
            updateVolume: updateVolume,
            toggleFullScreen: toggleFullScreen,
            selectRate: selectRate,
            selectEpisode: selectEpisode,
            nextEpisode: nextEpisode,
            changeEpisode: changeEpisode,
            changeRate: changeRate,
            videoMouseDown: videoMouseDown,
            startDrag: startDrag,
            formatTime: formatTime,
            onVideoEnded: onVideoEnded,
            emits: emits,
        };
    },
    emits: {},
    props: {
        playButtonImg: { type: String, default: playButton },
        pauseButtonImg: { type: String, default: pauseButton },
        nextButtonImg: { type: String, default: nextButton },
        progressBgImg: {
            type: String,
            default: ''
        },
        startPlay: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: ''
        },
        progressPlayedImg: {
            type: String,
            default: ''
        },
        progressThumbImg: {
            type: String,
            default: ''
        },
        placeholderImg: {
            type: String,
            default: ''
        }, // 没传时不展示
        controlsHeight: { type: String, default: '40px' },
        hidden: {
            type: Array,
            default: () => []
        },
        srcList: {
            type: Array,
            default: () => []
        }
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {
        playButtonImg: { type: String, default: playButton },
        pauseButtonImg: { type: String, default: pauseButton },
        nextButtonImg: { type: String, default: nextButton },
        progressBgImg: {
            type: String,
            default: ''
        },
        startPlay: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: ''
        },
        progressPlayedImg: {
            type: String,
            default: ''
        },
        progressThumbImg: {
            type: String,
            default: ''
        },
        placeholderImg: {
            type: String,
            default: ''
        }, // 没传时不展示
        controlsHeight: { type: String, default: '40px' },
        hidden: {
            type: Array,
            default: () => []
        },
        srcList: {
            type: Array,
            default: () => []
        }
    },
});
; /* PartiallyEnd: #4569/main.vue */
