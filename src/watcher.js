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
      () => store.additionalParametrs,
      (newValue) => {
        const initValues = {};
        for (const paramGroup of store.additionalParameters) {
          for (const param of paramGroup.parameters) {
            initValues[param.name] = param.default;
          }
        }
        console.log("Init additional parameters", initValues);
        parametersStore.$patch({
          additionalParameters: initValues,
        });
      }
    );

    watch(
      [() => parametersStore.tileSizes, () => parametersStore.tileOverlaps],
      (oldObj, newObj) => {
        if (newObj.y !== newObj.x) {
          newObj.y = newObj.x; // keep x and y the same
        }
        console.log(oldObj, newObj);
      },
      { deep: true }
    );
  });

  return () => {
    scope.stop();
  };
}
