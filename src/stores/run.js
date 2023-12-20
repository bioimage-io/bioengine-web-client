import { defineStore } from "pinia";
import { computed } from "vue";

async function waitRunable() {
  const store = useRunStore();
  const stateValue = computed(() => store.runable); // replace with your state

  while (stateValue.value !== true) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // polling interval
  }

  console.log("State changed to the specific value");
}

export const useRunStore = defineStore("run", {
  state: () => ({
    queryCount: 0,
    runable: false,
  }),
  actions: {
    async run() {
      await waitRunable();
      this.queryCount++;
      await waitRunable();
    },
  },
});
