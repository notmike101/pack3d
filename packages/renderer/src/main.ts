/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */

import { createApp } from 'vue';
import App from './App.vue';

createApp(App)
  .mount('#app')
  .$nextTick(window.removeLoading);
  