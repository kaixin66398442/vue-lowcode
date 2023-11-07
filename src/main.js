import { createApp } from 'vue'

// import 'element-plus/theme-chalk/index.css'
// 引入element-plus组件与样式
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import App from './App.vue'

// 获取应用实例对象
const app = createApp(App);
// 安装ElementPlus插件
app.use(ElementPlus);

createApp(App).mount('#app')
