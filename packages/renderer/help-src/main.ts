import { createApp } from 'vue';
import App from '@help/App.vue';

import '@help/assets/index.css';

createApp(App)
  .mount('#app')
  .$nextTick(window.removeLoading);
