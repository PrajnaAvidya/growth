// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

// import css
import 'vuetify/dist/vuetify.min.css';
import 'material-design-icons/iconfont/material-icons.css';

import Game from './game';

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
    el: '#game',
    template: '<Game/>',
    components: { Game }
});
