<template>
  <div class="app">
    <Editor v-model="state" :formData="formData"></Editor>
  </div>
</template>

<script>
import data from "./data.json";
import { provide, ref } from "vue";
import Editor from "./packages/editor";
import { registerConfig as config } from "./utils/editor-config";
export default {
  components: {
    Editor,
  },
  setup() {
    const state = ref(data);
    provide("config", config); // 将组件的配置直接传出

    const formData = ref({
      username: "张三",
      password: 123,
      start: 0,
      end: 100,
    });

    return {
      state,
      formData,
    };
  },
};
</script>

<style>
.app {
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
}
</style>
