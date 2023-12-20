<template>
  <div class="advance-setting-container">
    <div class="server-setting">
      <h3>Settings for server</h3>
      <label class="field-label">Server URL</label>
      <div class="field-row">
        <InputText id="server-select" v-model="serverURL" />
        <Button @click="this.updateServerUrl">Update</Button>
      </div>
    </div>
    <div class="tiling-setting" v-if="store.tritonConfig">
      <h3>Settings for image tiling</h3>
      <div class="field-row">
        <div class="field-column">
          <div
            v-if="'x' in store.inputMinShape && 'y' in store.inputMinShape"
          >
            <label class="field-label">Tile size(XY)</label>
            <InputNumber
              v-model="parametersStore.tileSizes.x"
              showButtons
              :min="store.inputMinShape.x"
              :max="store.inputMaxShape.x"
            ></InputNumber>
          </div>
          <div v-if="'z' in store.inputMinShape">
            <label class="field-label">Tile size(Z)</label>
            <InputNumber
              v-model="parametersStore.tileSizes.z"
              showButtons
              :min="store.inputMinShape.z"
              :max="store.inputMaxShape.z"
            ></InputNumber>
          </div>
        </div>
        <div class="field-column">
          <div
            v-if="'x' in store.inputMinShape && 'y' in store.inputMinShape"
          >
            <label class="field-label">Tile overlap(XY)</label>
            <InputNumber
              v-model="parametersStore.tileOverlaps.x"
              showButtons
              :min="0"
              :max="store.inputMaxShape.x"
            ></InputNumber>
          </div>
          <div v-if="'z' in store.inputMinShape">
            <label class="field-label">Tile overlap(Z)</label>
            <InputNumber
              v-model="parametersStore.tileOverlaps.z"
              showButtons
              :min="0"
              :max="store.inputMaxShape.z"
              ></InputNumber>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.advance-setting-container {
  padding-left: 20px;
  padding-bottom: 20px;
}
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
import { watch } from 'vue'
import { useStore } from '../stores/global'
import { useParametersStore } from '../stores/parameters'

export default {
  setup() {
    const store = useStore()
    const parametersStore = useParametersStore()
    
    watch(() => store.serverUrl, () => {
      this.serverURL = store.serverUrl
    })
    return {
      store: store,
      parametersStore: parametersStore,
    }
  },
  data: function() {
    const store = useStore()
    const defaultUrl = store.serverUrl
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
}
</script>