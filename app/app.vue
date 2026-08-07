<script setup lang="ts">
const config = useRuntimeConfig()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/brand/favicon.png', type: 'image/png' }
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
        left: 'text-[#F189AC]',
        center: 'text-[#F189AC]',
        right: 'text-[#F189AC]',
        toggle: 'text-[#F189AC] hover:bg-[#F189AC]/15',
        content: 'w-3/4 max-w-[75%]',
        header: 'bg-[#213574] border-[#1B2C61] text-[#F189AC]'
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
          link: 'text-[#F189AC] hover:text-[#FCE7EE] data-[active]:text-[#FCE7EE] before:bg-[#F189AC]/15'
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
        <UColorModeButton class="text-[#F189AC] hover:bg-[#F189AC]/15" />

        <UButton
          v-if="onAdminRoute"
          to="/"
          color="neutral"
          variant="ghost"
          label="User View"
          class="text-[#F189AC] hover:bg-[#F189AC]/15 hover:text-[#FCE7EE]"
        />

        <UButton
          v-else
          to="/admin"
          color="neutral"
          variant="ghost"
          :label="isLoggedIn ? 'Admin View' : 'Login'"
          class="text-[#F189AC] hover:bg-[#F189AC]/15 hover:text-[#FCE7EE]"
        />

        <UButton
          v-if="isLoggedIn"
          :to="logoutUrl"
          color="neutral"
          variant="ghost"
          label="Logout"
          external
          class="text-[#F189AC] hover:bg-[#F189AC]/15 hover:text-[#FCE7EE]"
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
