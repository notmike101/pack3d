<script setup lang="ts">
import { ipcRenderer } from 'electron';

const version = global.__VITE_PACKAGE_VERSION__;

const menuClose = () => {
  ipcRenderer.send('menu-close');
};

const menuMinimize = () => {
  ipcRenderer.send('menu-minimize');
};
</script>

<template>
  <header class="titlebar text-left flex flex-row w-full justify-between items-center bg-[#2b2b2b] text-white border-b border-b-[#222222] [-webkit-app-region:drag]">
    <div class="info h-full flex flex-row items-center justify-start p-[5px]">
      <span class="bg-[url('../assets/logo.svg')] w-[18px] h-full bg-no-repeat bg-center"></span>
      <span class="title ml-[5px]">Pack3D v{{ version }}</span>
    </div>
    <div class="buttons h-full flex flex-row items-center justify-end [-webkit-app-region:no-drag]">
      <button type="button" class="minimize h-full w-[18px] py-0 px-[20px] m-0 bg-transparent text-black border-0 cursor-pointer inline-block bg-[url('../assets/minimize.svg')] bg-center bg-no-repeat bg-[length:10px_10px] bg-[#898989] hover:bg-[#a6a6a6]" @click="menuMinimize"></button>
      <button type="button" class="close minimize h-full w-[18px] py-0 px-[20px] m-0 bg-transparent text-black border-0 cursor-pointer inline-block bg-[url('../assets/close.svg')] bg-center bg-no-repeat bg-[length:10px_10px] bg-[#c35a50] hover:bg-[#ec6c60]" @click="menuClose"></button>
    </div>
  </header>
</template>
