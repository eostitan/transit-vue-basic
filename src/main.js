import Vue from 'vue'
import App from './App.vue'
import ElementUI from "element-ui";
// import "element-ui/lib/theme-chalk/index.css";
import VueI18n from "vue-i18n";
import locale from "element-ui/lib/locale/lang/en";
import "element-theme-dark";
Vue.config.productionTip = false;
Vue.use(ElementUI, { locale });
Vue.use(VueI18n);
const i18n = new VueI18n({
  locale: "en",
  messages: {},
  silentTranslationWarn: true
});
new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app')
