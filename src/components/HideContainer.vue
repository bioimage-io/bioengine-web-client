<template>
    <details>
      <slot></slot>
      <summary>
        {{ summary }}
      </summary>
    </details>
</template>

<style scoped>
details > summary:before,
details[open] > summary:before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  left: -21px;
  background-image: url("data:image/svg+xml,%3Csvg width='14' height='9' viewBox='0 0 14 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L7 7.5L13 1.5' stroke='%230039A6' stroke-width='2'/%3E%3C/svg%3E%0A");
  background-repeat: no-repeat;
  background-position: center center;
  transition: 0.2s;
}

details[open] > summary:before {
  transform: rotate(180deg);
}

summary {
  user-select: none;
}
</style>

<script>
export default {
  props: {
    summary: String,
  },
}
</script>
