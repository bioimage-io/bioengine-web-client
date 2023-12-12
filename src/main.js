import { createApp } from 'vue'
import App from './App.vue'
import * as imjoyCore from 'imjoy-core'
import PrimeVue from 'primevue/config'
import Button from "primevue/button"
import 'primevue/resources/themes/saga-blue/theme.css'

const imjoy = new imjoyCore.ImJoy({
    imjoy_api: {},
    //imjoy config
});

imjoy.start({workspace: 'default'}).then(async ()=>{
    console.log('ImJoy started');
})

window.app = {};

window.app.imjoy = imjoy;

const app = createApp(App);

app.use(PrimeVue, { unstyled: false });
app.component('Button', Button);

app.mount('#app');
