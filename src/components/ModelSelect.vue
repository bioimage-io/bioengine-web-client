<template>
  <div>
    <Dropdown v-model="currentModel" :options="modelList" option-label="name">
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
export default {
  data() {
    return {
      currentModel: null,
      modelList: [],
    }
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
      const modelList = collections.filter(item => availableModels.includes(item.id))
      this.modelList = modelList
      this.currentModel = modelList[0]
    }
  }
}
</script>