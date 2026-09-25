import components, { DsVideo, DsIcon, DsProgressBar, DsModelBox, DsFloatingWindow, DsBgAudioPlayer, DsWhiteboard, DsKeyboard, DsPiano, DsPianoWaterfall, DsPerformEvaluation } from './components';
export default {
    install(app) {
        Object.entries(components).forEach(([name, component]) => {
            // 允许组件定义了自定义 name 时用它，否则用导入名
            const compName = component.name || name;
            app.component(compName, component);
        });
    },
};
export { DsVideo, DsIcon, DsProgressBar, DsModelBox, DsFloatingWindow, DsBgAudioPlayer, DsWhiteboard, DsKeyboard, DsPiano, DsPianoWaterfall, DsPerformEvaluation };
export * from './types/enum';
export * from './types/types';
