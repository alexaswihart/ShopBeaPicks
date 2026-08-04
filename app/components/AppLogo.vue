<script setup lang="ts">
const colorMode = useColorMode()

const src = computed(() =>
  colorMode.value === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png'
)
</script>

<template>
  <img
    :src="src"
    alt="Shop Bea Picks"
    class="h-16 sm:h-20 md:h-24 w-auto object-contain"
    width="256"
    height="256"
  >
</template>
