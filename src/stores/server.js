
import { defineStore } from "pinia";

export const useServerStore = defineStore("server", {
  state: () => ({
    serverUrl: "https://ai.imjoy.io",
    serviceId: "triton-client",
    updateCount: 0,
  }),
  persist: true,
});
