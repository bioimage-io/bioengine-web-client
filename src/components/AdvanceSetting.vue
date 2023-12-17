<template>
  <div>
    <div class="server-setting">
      <h3>Settings for server</h3>
      <label class="field-label">Server URL</label>
      <div class="field-row">
        <InputText id="server-select" v-model="serverURL" />
        <Button @click="this.updateServerUrl">Update</Button>
      </div>
    </div>
    <div class="tiling-setting" v-if="tritonConfig">
      <h3>Settings for image tiling</h3>
      <div class="field-row">
        <div class="field-column">
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
        <div class="field-column">
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
  </div>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.field-row {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}
.field-column {
  width: 15%;
  min-width: 220px;
}
#server-select {
  width: 300px;
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
    serverUrl: String,
  },
  data: function() {
    const defaultUrl = this.serverUrl
    const serverUrlList = [defaultUrl]
    if (defaultUrl === "https://hypha.bioimage.io") {
      serverUrlList.push("https://ai.imjoy.io")
    } else if (defaultUrl === "https://ai.imjoy.io") {
      serverUrlList.push("https://hypha.bioimage.io")
    } else {
      serverUrlList.push("https://hypha.bioimage.io")
      serverUrlList.push("https://ai.imjoy.io")
    }
    return {
      serverURL: serverUrlList[0],
      serverUrlList: serverUrlList,
    }
  },
  watch: {
    serverUrl() {
      console.log(this.serverUrl)
      this.serverURL = this.serverUrl
    },
  },
  methods: {
    updateServerUrl() {
      this.$emit('server-url-changed', this.serverURL)
    },
  }
}
</script>