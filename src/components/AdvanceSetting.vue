<template>
  <div class="tiling-setting" v-if="tritonConfig">
    <h3>Settings for image tiling</h3>
    <div style="display: flex; gap: 30px">
      <div style="width: 30%">
        <div
          v-if="'x' in inputMinShape && 'y' in inputMinShape"
        >
          <label>Tile size(XY)</label>
          <b-numberinput
            v-model="tileSizes.x"
            :min="inputMinShape.x"
            :max="inputMaxShape.x"
          ></b-numberinput>
        </div>
        <div v-if="'z' in inputMinShape">
          <label>Tile size(Z)</label>
          <b-numberinput
            v-model="tileSizes.z"
            :min="inputMinShape.z"
            :max="inputMaxShape.z"
          ></b-numberinput>
        </div>
      </div>
      <div style="width: 30%">
        <div
          v-if="'x' in inputMinShape && 'y' in inputMinShape"
        >
          <label>Tile overlap(XY)</label>
          <b-numberinput
            v-model="tileOverlaps.x"
            :min="0"
            :max="inputMaxShape.x"
          ></b-numberinput>
        </div>
        <div v-if="'z' in inputMinShape">
          <label>Tile overlap(Z)</label>
          <b-numberinput
            v-model="tileOverlaps.z"
            :min="0"
            :max="inputMaxShape.z"
          ></b-numberinput>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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