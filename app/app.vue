<script setup lang="ts">
const config = useRuntimeConfig()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/brand/logo-light.png', type: 'image/png' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = config.public.siteName
const description = 'Curated picks and stories from ShopBeaPicks.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const route = useRoute()
const onAdminRoute = computed(() => route.path.startsWith('/admin'))
const { isLoggedIn } = useAdminSession()

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Contact', to: '/contact' }
]

/**
 * Log out of the Access application cookie on the site domain.
 * Team-domain logout (/cdn-cgi/access/logout on *.cloudflareaccess.com)
 * often shows "Failed to log out" and is unnecessary for clearing /admin access.
 */
const logoutUrl = computed(() => {
  const site = String(config.public.siteUrl || 'https://shopbeapicks.pages.dev').replace(/\/$/, '')
  return `${site}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(`${site}/`)}`
})
</script>

<template>
  <UApp>
    <UHeader
      title="ShopBeaPicks"
      mode="slideover"
      :ui="{
        content: 'w-3/4 max-w-[75%]'
      }"
    >
      <template #left>
        <NuxtLink to="/" class="flex items-center" aria-label="Shop Bea Picks home">
          <AppLogo />
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #body>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          class="-mx-2.5"
          :ui="{
            link: 'text-base'
          }"
        />
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          v-if="onAdminRoute"
          to="/"
          color="neutral"
          variant="ghost"
          label="View site"
        />

        <UButton
          v-if="isLoggedIn"
          :to="logoutUrl"
          color="neutral"
          variant="ghost"
          label="Logout"
          external
        />

        <UButton
          v-else
          to="/admin"
          color="neutral"
          variant="ghost"
          label="Login"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} {{ title }}
        </p>
      </template>
      <template #right>
        <UNavigationMenu
          :items="navItems"
          variant="link"
          class="flex-wrap"
        />
      </template>
    </UFooter>
  </UApp>
</template>
