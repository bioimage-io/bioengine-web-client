import { defineStore } from "pinia";
import { computed } from "vue";

export async function waitState(stateFn, value) {
  const stateValue = computed(stateFn); // replace with your state

  while (stateValue.value !== value) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // polling interval
  }

  console.log("State changed to the specific value");
}

export async function waitRunable() {
  const store = useRunStore();
  await waitState(() => store.runable, true);
}

export const useRunStore = defineStore("run", {
  state: () => ({
    queryCount: 0,
    runable: false,
    modelInitialized: false,
    serverInitialized: false,
  }),
  actions: {
    async run() {
      await waitRunable();
      this.queryCount++;
      await waitRunable();
    },
  },
});
