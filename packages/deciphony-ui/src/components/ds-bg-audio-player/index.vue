<template>
    <div class="audio-player">
        <!-- 左侧：旋转的圆形图片 -->
        <div class="album-cover">
            <img :class="{spinning:isPlaying}" :src="currentSong.image" alt="Album Cover"/>
        </div>

        <!-- 右侧：播放进度和控制 -->
        <div class="controls">
            <!-- 音频名称 -->
            <div class="audio-title">{{ currentSong.title }}</div>

            <!-- 进度条 -->
            <div class="progress-container">
                <input
                    v-model="progress"
                    :max="duration"
                    class="progress-bar"
                    type="range"
                    @input="handleProgressChange"
                />

            </div>
            <div class="controls-bottom">
                <!-- 控制按钮 -->
                <div class="control-buttons">
                    <ds-icon name="arrowL" @click="prevSong"></ds-icon>
                    <ds-icon v-if="isPlaying" name="pause" @click="togglePlay"></ds-icon>
                    <ds-icon v-else name="play" @click="togglePlay"></ds-icon>
                    <ds-icon name="arrowR" @click="nextSong"></ds-icon>
                </div>
                <div class="time">
                    <span>{{ formatTime(currentTime) }}</span> / <span>{{ formatTime(duration) }}</span>
                </div>
            </div>

        </div>
    </div>
</template>

<script lang="ts" setup>
import {computed, ComputedRef, onBeforeUnmount, onMounted, PropType, ref, watch} from 'vue';

defineOptions({
    name: 'DsBgAudioPlayer' // 给组件一个全局 name
});
const props = defineProps({
    songs: {
        type: Array as PropType<{
            src: string,
            title: string,
            image: string,
        }[]>,
        required: true,
    },
})
// 音频播放器相关的状态
const audio = ref(new Audio());
const currentSongIndex = ref(0);
const isPlaying = ref(false);
const progress = ref(0);
const duration = ref(0);
const currentTime = ref(0);

// 当前播放的歌曲
const currentSong: ComputedRef<{
    src: string,
    title: string,
    image: string,
}> = computed(() => props.songs[currentSongIndex.value]);

// 播放/暂停切换
const togglePlay = () => {
    if (isPlaying.value) {
        audio.value.pause();
    } else {
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
    } else {
        currentSongIndex.value = props.songs.length - 1; // 从头播放
    }
    playSong();
};

// 播放下一首歌
const nextSong = () => {
    if (currentSongIndex.value < props.songs.length - 1) {
        currentSongIndex.value++;
    } else {
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
    } else {
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


</script>

<style scoped>
.audio-player {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.album-cover {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-right: 20px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.3s ease;
    flex-shrink: 0;
}

.album-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.controls {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
}

.audio-title {
    font-size: 18px;
    font-weight: bold;
}

.progress-container {
    position: relative;
}

.progress-bar {
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background-color: #eee;
    outline: none;
    appearance: none;
}

.progress-bar::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
}

.time {
    font-size: 14px;
    text-align: right;
}

.controls-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.control-buttons {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

button {
    padding: 8px 16px;
    border: none;
    background-color: #007bff;
    color: white;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #0056b3;
}

.spinning {
    animation: spin 5s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
