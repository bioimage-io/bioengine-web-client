import { defineStore } from "pinia";
import { loadCellposeRdf } from "../utils";

export const useStore = defineStore("store", {
  state: () => ({
    serverUrl: "https://ai.imjoy.io",
    serviceId: "triton-client",
    runner: null,
    viewerControl: null,
    models: [],
    currentModel: null,
  }),
  actions: {
    setCurrentModel(model) {
      this.currentModel = model;
    },
  },
  getters: {
    tritonConfig(state) {
      if (!state.runner) {
        return {};
      }
      return state.runner.modelTritonConfig;
    },

    inputMinShape(state) {
      if (!state?.runner?.rdf) {
        return {};
      }
      return state.runner.getInputMinShape();
    },

    inputMaxShape(state) {
      if (!state?.runner?.rdf) {
        return {};
      }
      return state.runner.getInputMaxShape();
    },

    inputSpec(state) {
      if (!state?.runner?.rdf) {
        return {};
      }
      return state.runner.rdf.inputs[0];
    },

    outputSpec(state) {
      if (!state?.runner?.rdf) {
        return {};
      }
      return state.runner.rdf.outputs[0];
    },

    additionalModels() {
      const cellposeRdf = loadCellposeRdf();
      return [cellposeRdf];
    },
  },
});
