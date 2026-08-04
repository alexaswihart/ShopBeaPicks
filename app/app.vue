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
        root: 'bg-[#213574] border-[#1B2C61]',
        left: 'text-[#F8CFE1]',
        center: 'text-[#F8CFE1]',
        right: 'text-[#F8CFE1]',
        toggle: 'text-[#F8CFE1] hover:bg-[#F8CFE1]/15',
        content: 'w-3/4 max-w-[75%]',
        header: 'bg-[#213574] border-[#1B2C61] text-[#F8CFE1]'
      }"
    >
      <template #left>
        <NuxtLink to="/" class="flex items-center" aria-label="Shop Bea Picks home">
          <AppLogo />
        </NuxtLink>
      </template>

      <UNavigationMenu
        :items="navItems"
        :ui="{
          link: 'text-[#F8CFE1] hover:text-[#FCEEF4] data-[active]:text-[#FCEEF4] before:bg-[#F8CFE1]/15'
        }"
      />

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
        <UColorModeButton class="text-[#F8CFE1] hover:bg-[#F8CFE1]/15" />

        <UButton
          v-if="onAdminRoute"
          to="/"
          color="neutral"
          variant="ghost"
          label="User View"
          class="text-[#F8CFE1] hover:bg-[#F8CFE1]/15 hover:text-[#FCEEF4]"
        />

        <UButton
          v-else
          to="/admin"
          color="neutral"
          variant="ghost"
          label="Admin View"
          class="text-[#F8CFE1] hover:bg-[#F8CFE1]/15 hover:text-[#FCEEF4]"
        />

        <UButton
          v-if="isLoggedIn"
          :to="logoutUrl"
          color="neutral"
          variant="ghost"
          label="Logout"
          external
          class="text-[#F8CFE1] hover:bg-[#F8CFE1]/15 hover:text-[#FCEEF4]"
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
