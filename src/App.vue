<template>
  <div id="app">
    
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

#app {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* 确保在所有屏幕尺寸下都能正确显示 */
body {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}</style>
