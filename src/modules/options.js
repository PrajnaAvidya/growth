import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

function defaultOptions() {
    return {
        notation: false,
    };
}

export default new Vuex.Store({
    state: defaultOptions(),
    mutations: {
        resetState(state) {
            Object.assign(state, defaultOptions());
        }
    }
});
