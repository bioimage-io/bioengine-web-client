import { watch, effectScope } from "vue";
import { useStore } from "./stores/global";
import { useParametersStore } from "./stores/parameters";

export function setupStoreWatcher() {
  const scope = effectScope();

  scope.run(() => {
    const store = useStore();
    const parametersStore = useParametersStore();

    watch(
      () => store.currentModel,
      (newValue) => {
        console.log("currentModel changed", newValue);
      }
    );

    watch(
      () => parametersStore.tileSizes,
      (oldObj, newObj) => {
        if (newObj.y !== newObj.x) {
          newObj.y = newObj.x; // keep x and y the same
        }
        console.log(newObj);
        parametersStore.$patch({ tileSizes: newObj });
      },
      { deep: true }
    );

    watch(
      () => parametersStore.tileOverlaps,
      (oldObj, newObj) => {
        if (newObj.y !== newObj.x) {
          newObj.y = newObj.x; // keep x and y the same
        }
        console.log(newObj);
        parametersStore.$patch({ tileOverlaps: newObj });
      },
      { deep: true }
    );
  });

  return () => {
    scope.stop();
  };
}
