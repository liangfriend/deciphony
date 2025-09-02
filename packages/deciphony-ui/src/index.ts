import { App } from 'vue';
import './types/components';
import components, { HlVideo, HlIcon, HlProgressBar } from './components';

export default {
  install(app: App) {
    components.forEach((c) => {
      console.log(c.name, c);
      app.component(c.name!, c);
    });
  }
};

export { HlVideo, HlIcon, HlProgressBar };
