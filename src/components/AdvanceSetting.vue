<template>
  <div class="tiling-setting" v-if="tritonConfig">
    <h3>Settings for image tiling</h3>
    <div style="display: flex; gap: 30px">
      <div style="width: 30%">
        <div
          v-if="'x' in inputMinShape && 'y' in inputMinShape"
        >
          <label class="field-label">Tile size(XY)</label>
          <InputNumber
            v-model="tileSizes.x"
            showButtons
            :min="inputMinShape.x"
            :max="inputMaxShape.x"
          ></InputNumber>
        </div>
        <div v-if="'z' in inputMinShape">
          <label class="field-label">Tile size(Z)</label>
          <InputNumber
            v-model="tileSizes.z"
            showButtons
            :min="inputMinShape.z"
            :max="inputMaxShape.z"
          ></InputNumber>
        </div>
      </div>
      <div style="width: 30%">
        <div
          v-if="'x' in inputMinShape && 'y' in inputMinShape"
        >
          <label class="field-label">Tile overlap(XY)</label>
          <InputNumber
            v-model="tileOverlaps.x"
            showButtons
            :min="0"
            :max="inputMaxShape.x"
          ></InputNumber>
        </div>
        <div v-if="'z' in inputMinShape">
          <label class="field-label">Tile overlap(Z)</label>
          <InputNumber
            v-model="tileOverlaps.z"
            showButtons
            :min="0"
            :max="inputMaxShape.z"
            ></InputNumber>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 5px;
  font: bold;
}
</style>

<script>
export default {
  props: {
    tritonConfig: Object,
    inputMinShape: Object,
    inputMaxShape: Object,
    tileSizes: Object,
    tileOverlaps: Object,
  },
}
</script>