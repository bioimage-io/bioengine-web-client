<template>
  <div>
    <Dropdown :disabled="!open" v-model="store.currentModel" :options="store.models" option-label="name">
      <template #value="slotProps">
        <div v-if="slotProps.value">
          <div>
            {{ slotProps.value.nickname_icon}} {{ slotProps.value.name }}
          </div>
        </div>
        <span v-else>
          {{ slotProps.placeholder }}
        </span>
      </template>
      <template #option="slotProps">
        <div>
          <div :title="slotProps.option.description">
            {{ slotProps.option.nickname_icon}} {{ slotProps.option.name }}
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<script>
import { useStore } from '../stores/global'

export default {
  setup() {
    const store = useStore()
    return {
      store: store
    }
  },
  props: {
    open: {
      type: Boolean,
      default: false
    },
  },
  mounted() {
    this.fetchModels()
  },
  methods: {
    async fetchAvailableModels() {
      const modelListUrl = "https://raw.githubusercontent.com/bioimage-io/bioengine-model-runner/gh-pages/manifest.bioengine.json"
      const response = await fetch(modelListUrl)
      const manifest = await response.json()
      const idList = manifest['collection'].map(item => item.id)
      return idList
    },
    async fetchCollections() {
      const url = "https://bioimage-io.github.io/collection-bioimage-io/rdf.json"
      const response = await fetch(url)
      const rdf = await response.json()
      return rdf['collection']
    },
    async fetchModels() {
      const availableModels = await this.fetchAvailableModels()
      const collections = await this.fetchCollections()
      let modelList = collections.filter(item => availableModels.includes(item.id))
      const store = useStore()
      const additionalModels = store.additionalModels
      if (additionalModels.length > 0) {
        modelList = modelList.concat(additionalModels)
      }
      store.$patch({
        models: modelList,
        currentModel: modelList[0]
      })
    }
  }
}
</script>