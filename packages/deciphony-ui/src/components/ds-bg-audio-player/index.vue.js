import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
defineOptions({
    name: 'DsBgAudioPlayer' // 给组件一个全局 name
});
const props = defineProps({
    songs: {
        type: Array,
        required: true,
    },
});
// 音频播放器相关的状态
const audio = ref(new Audio());
const currentSongIndex = ref(0);
const isPlaying = ref(false);
const progress = ref(0);
const duration = ref(0);
const currentTime = ref(0);
// 当前播放的歌曲
const currentSong = computed(() => props.songs[currentSongIndex.value]);
// 播放/暂停切换
const togglePlay = () => {
    if (isPlaying.value) {
        audio.value.pause();
    }
    else {
        audio.value.play();
    }
    isPlaying.value = !isPlaying.value;
};
// 更新进度条
const handleProgressChange = () => {
    audio.value.currentTime = progress.value;
};
// 更新进度
const updateProgress = () => {
    progress.value = audio.value.currentTime;
    currentTime.value = audio.value.currentTime;
};
// 播放上一首歌
const prevSong = () => {
    if (currentSongIndex.value > 0) {
        currentSongIndex.value--;
    }
    else {
        currentSongIndex.value = props.songs.length - 1; // 从头播放
    }
    playSong();
};
// 播放下一首歌
const nextSong = () => {
    if (currentSongIndex.value < props.songs.length - 1) {
        currentSongIndex.value++;
    }
    else {
        currentSongIndex.value = 0; // 播放完毕后从头开始
    }
    playSong();
};
// 播放当前歌曲
const playSong = () => {
    audio.value.src = currentSong.value.src;
    audio.value.play();
    isPlaying.value = true;
    duration.value = audio.value.duration;
};
// 格式化时间 (MM:SS)
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};
// 音频时间更新监听
watch(isPlaying, (newValue) => {
    if (newValue) {
        audio.value.play();
    }
    else {
        audio.value.pause();
    }
});
// 音频事件
onMounted(() => {
    audio.value.addEventListener('timeupdate', updateProgress);
    audio.value.addEventListener('ended', nextSong);
    playSong();
});
onBeforeUnmount(() => {
    audio.value.removeEventListener('timeupdate', updateProgress);
    audio.value.removeEventListener('ended', nextSong);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['album-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "audio-player" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "album-cover" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ class: ({ spinning: __VLS_ctx.isPlaying }) },
    src: (__VLS_ctx.currentSong.image),
    alt: "Album Cover",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "audio-title" },
});
(__VLS_ctx.currentSong.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "progress-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.handleProgressChange) },
    max: (__VLS_ctx.duration),
    ...{ class: "progress-bar" },
    type: "range",
});
(__VLS_ctx.progress);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "controls-bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-buttons" },
});
const __VLS_0 = {}.DsIcon;
/** @type {[typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    name: "arrowL",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    name: "arrowL",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.prevSong)
};
var __VLS_3;
if (__VLS_ctx.isPlaying) {
    const __VLS_8 = {}.DsIcon;
    /** @type {[typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        name: "pause",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        name: "pause",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.togglePlay)
    };
    var __VLS_11;
}
else {
    const __VLS_16 = {}.DsIcon;
    /** @type {[typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        name: "play",
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        name: "play",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.togglePlay)
    };
    var __VLS_19;
}
const __VLS_24 = {}.DsIcon;
/** @type {[typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    name: "arrowR",
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    name: "arrowR",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.nextSong)
};
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "time" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.formatTime(__VLS_ctx.currentTime));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.formatTime(__VLS_ctx.duration));
/** @type {__VLS_StyleScopedClasses['audio-player']} */ ;
/** @type {__VLS_StyleScopedClasses['album-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['audio-title']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-container']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['controls-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['control-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['time']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isPlaying: isPlaying,
            progress: progress,
            duration: duration,
            currentTime: currentTime,
            currentSong: currentSong,
            togglePlay: togglePlay,
            handleProgressChange: handleProgressChange,
            prevSong: prevSong,
            nextSong: nextSong,
            formatTime: formatTime,
        };
    },
    props: {
        songs: {
            type: Array,
            required: true,
        },
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {
        songs: {
            type: Array,
            required: true,
        },
    },
});
; /* PartiallyEnd: #4569/main.vue */
