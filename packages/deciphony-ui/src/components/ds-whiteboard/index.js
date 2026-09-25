import com from './index.vue';
com.install = (app) => {
    app.component(com.name, com);
};
export default com;
