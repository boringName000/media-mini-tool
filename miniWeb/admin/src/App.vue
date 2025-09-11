<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// App.vue 只负责渲染路由视图
// 登录状态检查已在 main.js 和路由守卫中处理
</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100vw;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
</style>