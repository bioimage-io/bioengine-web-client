import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import "primevue/resources/themes/saga-blue/theme.css";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from "./App.vue";
import { useStore } from "./stores/global";
import { useParametersStore } from "./stores/parameters";
import { useServerStore } from "./stores/server";
import { setupStoreWatcher } from "./watcher";
import { useRunStore, waitState, waitRunable } from "./stores/run";

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
  const api = app.imjoy.api;
  window.app.imjoy = api;
  const clientApi = await createImjoyApi(api)
  window.app.client = clientApi;
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
        src: "https://staging.chat.bioimage.io/public/apps/bioimageio-chatbot-client/index",
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

async function createImjoyApi(api) {
  function setup() {
    api.log("Bioengine web client initialized.");
  }
  async function runModel() {
    const runStore = window.app.store.run;
    await runStore.run();
  }
  function setParameters(params) {
    const paramsStore = window.app.store.parameters;
    paramsStore.$patch({
      additionalParameters: params,
    });
  }
  function listModels() {
    const globalStore = window.app.store.global;
    return globalStore.models;
  }
  async function setModel(model) {
    console.log(model);
    const globalStore = window.app.store.global;
    const runStore = window.app.store.run;
    runStore.$patch({ modelInitialized: false });
    if (typeof model === "string") {
      const label = model.toLowerCase();
      for (const m of globalStore.models) {
        if (
          m.nickname.toLowerCase() === label ||
          m.name.toLowerCase() === label ||
          m.id.toLowerCase() === label
        ) {
          if (globalStore.currentModel === m) {
            runStore.$patch({ modelInitialized: true });
            return;
          }
          globalStore.$patch({
            currentModel: m,
          });
          break;
        }
      }
    } else {
      globalStore.$patch({
        currentModel: model,
      });
    }
    await waitState(() => runStore.modelInitialized, true);
  }
  function setTiling(tileSizes = undefined, tileOverlaps = undefined) {
    const paramsStore = window.app.store.parameters;
    const tileSizesObj = {};
    Object.assign(tileSizesObj, paramsStore.tileSizes);
    if (tileSizes) {
      Object.assign(tileSizesObj, tileSizes);
    }
    const tileOverlapsObj = {};
    Object.assign(tileOverlapsObj, paramsStore.tileOverlaps);
    if (tileOverlaps) {
      Object.assign(tileOverlapsObj, tileOverlaps);
    }
    paramsStore.$patch({
      tileSizes: tileSizesObj,
      tileOverlaps: tileOverlapsObj,
    });
  }
  async function waitForReady() {
    await waitRunable();
  }
  async function setServerSetting(serverUrl, serviceId) {
    const serverStore = window.app.store.server;
    const runStore = window.app.store.run;
    runStore.$patch({ serverInitialized: false });
    if ((serverStore.serverUrl === serverUrl) && (serverStore.serviceId === serviceId)) {
      runStore.$patch({ serverInitialized: true });
      return;
    }
    serverStore.$patch({
      serverUrl: serverUrl,
      serviceId: serviceId,
    });
    await waitState(() => runStore.serverInitialized, true);
  }

  return {
    setup,
    runModel,
    setParameters,
    listModels,
    setModel,
    setTiling,
    waitForReady,
    setServerSetting,
  };
}

async function initImJoy() {
  // start as an plugin
  if (window.self !== window.top) {
    const imjoyRPC = await loadImJoyRPC();
    const api = await imjoyRPC.setupRPC({ name: "bioengine-web-client" });
    window.app.imjoy = api;
    const clientApi = await createImjoyApi(api)
    await api.export(clientApi);
    window.api.client = clientApi;
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
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.mount("#app");

window.app.vue = app;

window.app.store = {
  global: useStore(),
  server: useServerStore(),
  parameters: useParametersStore(),
  run: useRunStore(),
};

setupStoreWatcher();
