import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import "primevue/resources/themes/saga-blue/theme.css";

import App from "./App.vue";
import { useStore } from "./stores/global";
import { useParametersStore } from "./stores/parameters";
import { setupStoreWatcher } from "./watcher";

window.app = {};

async function setupImJoyApp() {
  const app = await loadImJoyBasicApp({
    name: "BioEgnine Web Client",
    process_url_query: true,
    show_window_title: false,
    show_progress_bar: true,
    show_empty_window: true,
    menu_style: { position: "absolute", right: 0, top: "2px" },
    window_style: { width: "100%", height: "100%" },
    main_container: null,
    menu_container: "menu-container",
    window_manager_container: null,
    expose_api: true,
    imjoy_api: {},
  });
  window.app.imjoy = app.imjoy;
  const api = app.imjoy.api;
  // if you want to let users to load new plugins, add a menu item
  app.addMenuItem({
    label: "➕ Load Plugin",
    callback() {
      const uri = prompt(
        `Please type a ImJoy plugin URL`,
        "https://github.com/imjoy-team/imjoy-plugins/blob/master/repository/ImageAnnotator.imjoy.html"
      );
      if (uri) app.loadPlugin(uri);
    },
  });

  app.addMenuItem({
    label: "➕ Chatbot",
    async callback() {
      const chatbot = await api.createWindow({
        src: "https://chat.bioimage.io/public/apps/bioimageio-chatbot-client/index",
        name: "BioImage.IO Chatbot",
      });
      await chatbot.registerExtension({
        _rintf: true,
        name: "runImageJMacro",
        description: "Run a macro in ImageJ.JS",
        async get_schema() {
          return {
            type: "object",
            title: "RunImageJMacro",
            description: "Run a macro in ImageJ.JS",
            properties: {
              macro: {
                type: "string",
                description: "The macro to run",
              },
              args: {
                type: "object",
                description: "Arguments for the macro",
              },
            },
          };
        },
        async execute(config) {
          let ij = await api.getWindow("ImageJ.JS");
          if (!ij) {
            ij = await api.createWindow({
              src: "https://ij.imjoy.io",
              name: "ImageJ.JS",
            });
          }
          try {
            const result = await ij.runMacro(config["macro"], config["args"]);
            return result;
          } catch (e) {
            console.error(e);
            return e.toString();
          }
        },
      });
    },
  });
  return app;
}

async function initImJoy() {
  // start as an plugin
  if (window.self !== window.top) {
    const imjoyRPC = await loadImJoyRPC();
    const api = await imjoyRPC.setupRPC({ name: "BioImage.IO Chatbot" });
    api.export({ setup() {} });
  } else {
    // start as an standalone app
    await setupImJoyApp();
  }
}

const app = createApp(App);

initImJoy();

app.use(PrimeVue, { unstyled: false });
app.component("Button", Button);
app.component("InputNumber", InputNumber);
app.component("Dropdown", Dropdown);
app.component("InputText", InputText);

const pinia = createPinia();
app.use(pinia);
app.mount("#app");

window.app.vue = app;

window.app.store = {
  global: useStore(),
  parameters: useParametersStore(),
};

setupStoreWatcher();
