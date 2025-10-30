import {App} from 'vue';
import './types/components';
import components, {
    DsBgAudioPlayer,
    DsFloatingWindow,
    DsIcon,
    DsModelBox,
    DsProgressBar,
    DsVideo,
    DsWhiteboard,
    DsKeyboard,
    DsPiano,
    DsPianoWaterfall,
    DsPerformEvaluation
} from './components';

export default {
    install(app: App) {
        components.forEach((c) => {
            app.component(c.name!, c);
        });
    }
};

export {
    DsVideo,
    DsIcon,
    DsProgressBar,
    DsModelBox,
    DsFloatingWindow,
    DsBgAudioPlayer,
    DsWhiteboard,
    DsKeyboard,
    DsPiano,
    DsPianoWaterfall,
    DsPerformEvaluation
};

export {KeyCodeEnum} from './types/enum'