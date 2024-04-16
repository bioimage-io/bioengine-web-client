<template>
  <div class="advance-setting-container">
    <div class="server-setting">
      <h3>Settings for server</h3>
      <div class="field-row">
        <div class="field-column" style="width: 200px">
          <label class="field-label">Server URL</label>
          <InputText id="server-select" v-model="serverURL" />
        </div>
        <div class="field-column" style="width: 140px">
          <label class="field-label">Triton Service ID</label>
          <InputText id="service-select" style="width: 140px" v-model="serviceId" />
        </div>
        <Button @click="updateServerSetting" style="margin-top: 25px">Update</Button>
      </div>
    </div>
    <div class="tiling-setting" v-if="store.tritonConfig">
      <h3>Settings for image tiling</h3>
      <div class="field-row">
        <div class="field-column tile-field">
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
        <div class="field-column tile-field">
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
  width: 20%;
}
.tile-field {
  min-width: 220px;
}
</style>

<script>
import { watch, ref } from 'vue'
import { useServerStore } from '../stores/server'
import { useStore } from '../stores/global'
import { useParametersStore } from '../stores/parameters'

export default {
  setup() {
    const store = useStore()
    const serverStore = useServerStore()
    const parametersStore = useParametersStore()
    const serverURL = ref(serverStore.serverUrl)
    const serviceId = ref(serverStore.serviceId)

    const updateServerSetting = () => {
      serverStore.$patch({
        serverUrl: serverURL.value,
        serviceId: serviceId.value,
        updateCount: serverStore.updateCount + 1
      })
    }
    
    watch(() => (serverStore.serverUrl, serverStore.serviceId), () => {
      console.log('serverUrl:', serverStore.serverUrl)
      console.log('serviceId:', serverStore.serviceId)
      serverURL.value = serverStore.serverUrl
      serviceId.value = serverStore.serviceId
    })
    return {
      store,
      serverStore,
      parametersStore,
      serverURL,
      serviceId,
      updateServerSetting
    }
  },
}
</script>