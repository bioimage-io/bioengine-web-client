import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => ({
    serverUrl: "https://ai.imjoy.io",
    runner: null,
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
      const cellposeRdf = {
        id: "cellpose-python",
        name: "Cellpose",
        nickname: "cellpose-python",
        nickname_icon: "🌸",
        description: "Cellpose model for segmenting nuclei and cytoplasms.",
        inputs: [
          {
            axes: "cyx",
            data_type: "float32",
            shape: {
              min: [1, 64, 64],
              step: [1, 16, 16],
            },
          },
        ],
        outputs: [
          {
            axes: "cyx",
          },
        ],
        sample_inputs: [
          "https://zenodo.org/api/records/6647674/files/sample_input_0.tif/content",
        ],
        additional_parameters: [
          {
            name: "Cellpose Parameters",
            parameters: [
              {
                name: "diameter",
                type: "number",
                default: 30,
                description: "Diameter of the nuclei in pixels.",
              },
              {
                name: "model_type",
                type: "string",
                default: "nuclei",
                description: "Type of cells to segment.",
                enum: ["nuclei", "cyto"],
              },
            ],
          },
        ],
      };

      return [cellposeRdf];
    },

    additionalParameters(state) {
      if (!state?.runner?.rdf) {
        return [];
      }
      const params = state?.runner?.rdf?.additional_parameters || [];
      console.log("Additional parameters: ", params);
      return params;
    },
  },
});
