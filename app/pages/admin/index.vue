<script setup lang="ts">
/**
 * /admin remains the Access login entry point, then lands on the home feed
 * where create/edit/delete live in Admin View.
 */
definePageMeta({
  middleware: 'admin'
})

await navigateTo('/', { replace: true })
</script>

<template>
  <div />
</template>
