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
const { isLoggedIn, isAdminView, enterAdminView, enterUserView } = useAdminSession()

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Contact', to: '/contact' }
]

const headerNavUi = {
  link: 'text-canvas hover:text-secondary data-[active]:text-secondary hover:bg-transparent before:bg-transparent'
}

const slideoverNavUi = {
  link: 'text-base text-default hover:text-secondary data-[active]:text-secondary hover:bg-transparent before:bg-transparent'
}

const headerControlClass = 'text-canvas hover:text-secondary hover:bg-transparent'

function goUserView() {
  enterUserView()
  if (onAdminRoute.value) {
    return navigateTo('/')
  }
}
</script>

<template>
  <UApp>
    <UHeader
      title="ShopBeaPicks"
      mode="slideover"
    >
      <template #left>
        <div class="flex items-center gap-4 sm:gap-6">
          <NuxtLink to="/" class="flex items-center shrink-0" aria-label="Shop Bea Picks home">
            <AppLogo />
          </NuxtLink>

          <UNavigationMenu
            :items="navItems"
            class="hidden lg:flex"
            :ui="headerNavUi"
          />
        </div>
      </template>

      <template #body>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          class="-mx-2.5"
          :ui="slideoverNavUi"
        />
      </template>

      <template #right>
        <div class="header-utils flex items-center">
          <UColorModeButton :class="headerControlClass" />

          <UButton
            v-if="!isLoggedIn"
            to="/admin"
            color="neutral"
            variant="link"
            icon="i-ic-outline-login"
            aria-label="Login"
            :class="headerControlClass"
          />

          <UButton
            v-else-if="onAdminRoute || isAdminView"
            color="neutral"
            variant="link"
            label="User View"
            :class="headerControlClass"
            @click="goUserView"
          />

          <UButton
            v-else
            color="neutral"
            variant="link"
            label="Admin View"
            :class="headerControlClass"
            @click="enterAdminView"
          />

          <UButton
            v-if="isLoggedIn"
            to="/admin/logout"
            color="neutral"
            variant="link"
            icon="i-ic-outline-logout"
            aria-label="Logout"
            external
            :class="headerControlClass"
          />
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          {{ new Date().getFullYear() }} {{ title }}
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
