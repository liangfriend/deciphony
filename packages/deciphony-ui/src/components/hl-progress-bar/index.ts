import { App } from 'vue';
import com from './index.vue';

com.install = (app: App) => {
  app.component(com.name!, com);
};

export default com;
