import {App} from 'vue';
import './types/components';
import components, {HlVideo, HlIcon, HlProgressBar, DsModelBox} from './components';

export default {
    install(app: App) {
        components.forEach((c) => {
            app.component(c.name!, c);
        });
    }
};

export {HlVideo, HlIcon, HlProgressBar, DsModelBox};
