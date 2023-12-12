<template>
  <div class="overlay-container">
    <div v-if="open" class="overlay"></div>
    <slot></slot>
  </div>
</template>

<style scoped>
.overlay-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute; /* Sit on top of the page content */
  display: block; /* Hidden by default */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(61, 60, 60, 0.5); /* Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
  cursor: pointer; /* Add a pointer on hover */
}
</style>

<script>
export default {
  props: {
    open: Boolean,
  },
}
</script>
