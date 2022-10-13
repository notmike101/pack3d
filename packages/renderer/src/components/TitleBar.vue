<script setup lang="ts">
import { ipcRenderer } from 'electron';

const menuClose = () => {
  ipcRenderer.send('menu-close');
};

const menuMinimize = () => {
  ipcRenderer.send('menu-minimize');
};
</script>

<template>
  <header class="titlebar">
    <div class="info">
      <span class="icon"></span>
    </div>
    <div class="title">
      <span>Pack3D - Mike Orozco (notmike101)</span>
    </div>
    <div class="buttons">
      <button type="button" class="minimize" @click="menuMinimize"></button>
      <button type="button" class="close" @click="menuClose"></button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.titlebar {
  text-align: left;
  font-size: 12px;
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  background-color: #2b2b2b;
  color: #ffffff;
  -webkit-app-region: drag;
  border-bottom: 1px solid #222222;

  .info {
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding-left: 5px;

    .icon {
      background-image: url('../assets/logo.svg');
      background-repeat: no-repeat;
      background-position: center;
      display: block;
      height: 100%;
      width: 18px;
    }
  }

  .title {
    padding: 5px 0 4px 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .buttons {
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    // padding-right: 5px;
    -webkit-app-region: no-drag;

    button {
      height: 100%;
      padding: 0 20px;
      margin: 0;
      background-color: transparent;
      color: black;
      border: 0;
      cursor: pointer;
      display: inline-block;

      &:not(:last-of-type) {
        margin-right: 2px;
      }
      
      &.close {
        background-image: url('../assets/close.svg');
        background-size: 10px;
        background-position: center center;
        background-repeat: no-repeat;
        width: 18px;
        height: 100%;
        background-color: #c35a50;

        &:hover {
          background-color: #ec6c60;
        }
      }

      &.minimize {
        background-image: url('../assets/minimize.svg');
        background-size: 10px;
        background-position: center center;
        background-repeat: no-repeat;
        width: 18px;
        height: 100%;
        background-color: #898989;

        &:hover {
          background-color: #a6a6a6;
        }
      }
    }
  }
}
</style>
