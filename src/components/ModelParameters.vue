<template>
  <div v-if="pstore.additionalParametersSchema && (pstore.additionalParametersSchema.length > 0)">
    <HideContainer :summary="'Model parameters'">
      <OverlayContainer :open="overlay">
        <div class="model-params-container">
          <div v-for="(paramGroup, index) in pstore.additionalParametersSchema" :key="index">
            <h3>{{ paramGroup.name }}</h3>
            <div v-for="(param, index2) in paramGroup.parameters" :key="index">
              <label class="field-label">{{ param.name }}</label>
              <InputNumber showButtons v-if="param.type === 'number'" v-model="pstore.additionalParameters[param.name]" />
              <Dropdown :options="param.enum" v-else-if="param.enum" v-model="pstore.additionalParameters[param.name]" />
              <InputText v-else="param.type === 'string'" v-model="pstore.additionalParameters[param.name]" />
            </div>
          </div>
        </div>
      </OverlayContainer>
    </HideContainer>
  </div>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.model-params-container {
  padding-left: 20px;
  padding-bottom: 20px;
}
</style>

<script>
import { watch, ref } from 'vue';
import HideContainer from './HideContainer.vue';
import OverlayContainer from './OverlayContainer.vue';
import { useParametersStore } from '../stores/parameters';

export default {
  setup() {
    const parametersStore = useParametersStore();

    return {
      pstore: parametersStore,
    }
  },
  props: {
    overlay: Boolean,
  },
  components: {
    HideContainer,
    OverlayContainer
},
}
</script>