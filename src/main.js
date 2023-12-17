import { createApp } from "vue";
import App from "./App.vue";
import * as imjoyCore from "imjoy-core";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import "primevue/resources/themes/saga-blue/theme.css";

const imjoy = new imjoyCore.ImJoy({
  imjoy_api: {},
  //imjoy config
});

window.app = {};

imjoy.start({ workspace: "default" }).then(async () => {
  console.log("ImJoy started");
  window.app.imjoy = imjoy;
});

const app = createApp(App);

app.use(PrimeVue, { unstyled: false });
app.component("Button", Button);
app.component("InputNumber", InputNumber);
app.component("Dropdown", Dropdown);
app.component("InputText", InputText);

app.mount("#app");
