import { defineStore } from "pinia";

export const useParametersStore = defineStore("parameters", {
  state: () => ({
    tileSizes: { x: 0, y: 0, z: 0 },
    tileOverlaps: { x: 0, y: 0, z: 0 },
    additionalParameters: {},
    additionalParametersSchema: {},
  }),
});
