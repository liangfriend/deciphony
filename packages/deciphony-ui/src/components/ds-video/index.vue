<template>
    <div class="ds-video">
        <video
            v-if="videoAvailable"
            ref="videoRef"
            :src="srcList?.[srcListIndex]?.url"
            class="video"
            playsinline
            webkit-playsinline
            x-webkit-airplay="allow"
            x5-video-player-fullscreen="false"
            x5-video-player-type="h5"
            @ended="onVideoEnded"
            @loadedmetadata="updateDuration"
            @pointerdown="videoMouseDown"
            @timeupdate="updateProgress"
        />
        <div v-else class="ds-video-placeholder">
            <img
                v-if="placeholderImg"
                :src="placeholderImg"
                alt="ds-video-placeholder"
                class="ds-video-placeholder-img"
            />
            <div v-else class="ds-video-placeholder-default">无视频</div>
        </div>
        <!--  顶部返回按钮  -->
        <div v-show="operationShow" class="header">
            <div class="header-mask"></div>
            <div class="back" @click="emits('back')">
                <img :src="back"/>
            </div>
            <div class="title">{{ title }}</div>
        </div>
        <!-- 控制条 -->
        <div v-show="operationShow" :class="{ disabled: !videoAvailable }" class="ds-video-controls">
            <div class="ds-video-controls-mask"></div>
            <div class="top">
                <div class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
            </div>
            <div class="middle">
                <!-- 进度条 -->
                <div class="progress-bar" @click="seek($event)">
                    <img v-if="props.progressBgImg" :src="props.progressBgImg" class="progress-bg"/>
                    <div v-else class="progress-bg default-bg"/>

                    <div :style="{ width: `${progressPercent}%` }" class="progress-played">
                        <img
                            v-if="props.progressPlayedImg"
                            :src="props.progressPlayedImg"
                            class="progress-played-img"
                        />
                        <div v-else class="progress-played-img default-played"/>
                    </div>
                    <div v-if="props.progressThumbImg" @touchstart.prevent="startDrag">
                        <img
                            :src="props.progressThumbImg"
                            :style="{ left: `${progressPercent}%` }"
                            class="thumb"
                        />
                    </div>

                    <div
                        v-else
                        :style="{ left: `${progressPercent}%` }"
                        class="thumb default-thumb"
                        @touchstart.prevent="startDrag"
                    />
                </div>
            </div>
            <div class="bottom">
                <div class="left">
                    <div
                        v-if="(props.playButtonImg && !isPlaying) || (props.pauseButtonImg && isPlaying)"
                        @click="togglePlay"
                    >
                        <img
                            :src="isPlaying ? props.pauseButtonImg : props.playButtonImg"
                            class="btn play-btn"
                        />
                    </div>

                    <div v-else class="play-btn default-icon" @click="togglePlay"></div>
                    <div
                        v-if="(props.playButtonImg && !isPlaying) || (props.pauseButtonImg && isPlaying)"
                        @click="nextEpisode"
                    >
                        <img :src="props.nextButtonImg" :style="{ marginLeft: '1rem' }" class="btn play-btn"/>
                    </div>
                </div>
                <div class="right">
                    <!-- 其他控件 -->
                    <input
                        v-if="!hidden.includes('volume')"
                        v-model="volume"
                        :disabled="!videoAvailable"
                        class="volume rightButton"
                        max="1"
                        min="0"
                        step="0.01"
                        type="range"
                        @input="updateVolume"
                    />

                    <div v-if="!hidden.includes('rate')" class="rightButton" @click="selectRate">倍速</div>
                    <div v-if="!hidden.includes('episode')" class="rightButton" @click="selectEpisode">
                        选集
                    </div>
                    <div
                        v-if="!hidden.includes('fullscreen')"
                        :disabled="!videoAvailable"
                        class="rightButton"
                        @click="toggleFullScreen"
                    >
                        全屏
                    </div>
                </div>
            </div>
        </div>
        <!--  右侧弹窗  -->
        <div
            v-if="srcList"
            v-show="rightModelShow"
            :class="{ verticalCenter: rightModelType === 'rate' }"
            :style="{ width: rightModelType === 'episode' ? '300px' : '150px' }"
            class="rightModel"
        >
            <template v-if="rightModelType === 'episode'">
                <div
                    v-for="(item, index) in srcList"
                    :key="'episode' + index"
                    :class="{ active: index === srcListIndex }"
                    class="item"
                    @click="changeEpisode(index)"
                >
                    {{ item.title }}
                </div>
            </template>
            <template v-if="rightModelType === 'rate'">
                <div
                    v-for="(item, index) in rateList"
                    :key="'rate' + index"
                    :class="{ active: index === curRateIndex }"
                    class="item itemRate"
                    @click="changeRate(index)"
                >
                    {{ item.title }}
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, PropType, ref} from 'vue';
import playButton from '@assets/images/ds-video/play.png';
import pauseButton from '@assets/images/ds-video/pause.png';
import nextButton from '@assets/images/ds-video/next.png';
import back from '@assets/images/ds-video/back.png';

defineOptions({
    name: 'DsVideo' // 给组件一个全局 name
});
type srcListItem = {
    url: string;
    title: string;
};
const props = defineProps({
    playButtonImg: {type: String, default: playButton},
    pauseButtonImg: {type: String, default: pauseButton},
    nextButtonImg: {type: String, default: nextButton},
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
    controlsHeight: {type: String, default: '40px'},
    hidden: {
        type: Array,
        default: () => []
    },
    srcList: {
        type: Array as PropType<Array<srcListItem>>,
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
const progressPercent = computed(() =>
    duration.value ? (currentTime.value / duration.value) * 100 : 0
);

const volume = ref(1);

// const playbackRate = ref(1);

function togglePlay() {
    if (!videoRef.value) return;

    if (videoRef.value.paused) {
        videoRef.value.play();
        isPlaying.value = true;
    } else {
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
    if (!videoRef.value) return;
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
    if (!player) return;
    if (!document.fullscreenElement) {
        player.requestFullscreen?.();
    } else {
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
    if (!dragging || !videoRef.value) return;
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
</script>
<style lang="scss" scoped>
$topH: 40px;
$middleH: 40px;
$bottomH: 40px;
$playBtnSize: 20px;
.ds-video {
    position: relative;
    width: 100%;
    height: 100%;
}

video {
    // video默认样式重置
    display: block;
    width: 100%;
    height: 100%;
}

.ds-video-placeholder {
    width: 100%;
    background: #111;
    aspect-ratio: 16/9;
    display: flex;
    justify-content: center;
    align-items: center;
}

.ds-video-placeholder-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.ds-video-placeholder-default {
    color: #888;
    font-size: 18px;
}

.header {
    position: absolute;
    width: 100%;
    height: 140px;
    top: 0;

    .back {
        top: 0.75rem;
        left: 1.125rem;
        position: absolute;
        width: 1.25rem;
        height: 1.25rem;

        > img {
            width: 100%;
            height: 100%;
        }
    }

    .title {
        top: 0.625rem;
        left: 3rem;
        position: absolute;
        width: fit-content;
        height: 20px;
        color: white;

        > img {
            width: 100%;
            height: 100%;
        }
    }

    .header-mask {
        height: 140px;
        width: 100%;
        top: 0;
        background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
        z-index: 0;
        position: absolute;
    }
}

.ds-video-controls {
    position: absolute;
    width: 100%;
    height: $bottomH + $middleH + $topH;
    bottom: 0;

    & {
        > * {
            position: relative;
            z-index: 10;
        }
    }

    .ds-video-controls-mask {
        height: $bottomH + $middleH + $topH;
        width: 100%;
        bottom: 0;
        position: absolute;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
        z-index: 0;
    }

    .top {
        padding-left: 18px;
        padding-right: 18px;
        height: $topH;
        display: flex;
        align-items: center;

        .time-display {
            color: white;
            font-size: 14px;
            line-height: $topH;
        }
    }

    .middle {
        padding-left: 18px;
        padding-right: 18px;
        display: flex;
        align-items: center;
        width: 100%;
        height: $middleH;

        .progress-bar {
            width: 100%;
            height: 4px;
            position: relative;
            display: flex;
            align-items: center;
        }

        .progress-bg.default-bg {
            width: 100%;
            height: 100%;
            background: #ffffff;
            position: absolute;
            opacity: 0.2;
        }

        .progress-played {
            height: 100%;
            width: 100%;
            background: rgba(255, 255, 255, 0.6);
        }

        .thumb.default-thumb {
            position: absolute;
            height: 100%;
            aspect-ratio: 1;
            background: #fff;
            border-radius: 50%;
            transform: translateX(-50%);
            border: 2px solid #fff;
            cursor: pointer;
        }

        .progress-played-img.default-played {
            position: absolute;
            height: 100%;
            background: #0cf;
        }
    }

    .bottom {
        margin-left: 18px;
        margin-right: 18px;
        display: flex;
        justify-content: space-between;
        height: $bottomH;
        align-items: center;

        .left {
            display: flex;
            flex-shrink: 0;

            .play-btn {
                width: $playBtnSize;
                height: $playBtnSize;
                cursor: pointer;
            }

            .default-icon {
                flex-shrink: 0;
                background: #666;
                width: $playBtnSize;
                height: $playBtnSize;
                color: #fff;
                text-align: center;
                line-height: 30px;
                border-radius: 50%;
                font-weight: bold;
                cursor: pointer;
            }
        }

        .right {
            display: flex;
            flex-shrink: 0;

            .rightButton {
                flex-shrink: 0;
                width: fit-content;
                margin-left: 18px;
                font-size: 14px;
                white-space: nowrap;
                color: white;
            }
        }
    }
}

.disabled {
}

.rightModel {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.85);
    z-index: 11;
    padding: 18px;

    .item {
        color: white;
        margin-bottom: 10px;
        width: 100%;
        height: 34px;
        line-height: 34px;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        text-align-last: center;
        cursor: pointer;
    }

    .itemRate {
        border: unset;
    }

    .active {
        color: #ff7882;
    }
}

.verticalCenter {
    display: flex;
    justify-content: center;
    flex-direction: column;
}
</style>
