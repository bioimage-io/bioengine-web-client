<template>
  <div v-if="parameters && (parameters.length > 0)">
    <HideContainer :summary="'Model parameters'">
      <OverlayContainer :open="overlay">
        <div class="model-params-container">
          <div v-for="(paramGroup, index) in parameters" :key="index">
            <h3>{{ paramGroup.name }}</h3>
            <div v-for="(param, index2) in paramGroup.parameters" :key="index">
              <label class="field-label">{{ param.name }}</label>
              <InputNumber showButtons v-if="param.type === 'number'" v-model="parameterValues[param.name]" />
              <Dropdown :options="param.enum" v-else-if="param.enum" v-model="parameterValues[param.name]" />
              <InputText v-else="param.type === 'string'" v-model="parameterValues[param.name]" />
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
import HideContainer from './HideContainer.vue';
import OverlayContainer from './OverlayContainer.vue';

export default {
  props: {
    parameters: Array,
    parameterValues: Object,
    overlay: Boolean,
  },
  components: {
    HideContainer,
    OverlayContainer
},
}
</script>