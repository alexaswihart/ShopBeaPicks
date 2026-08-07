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
          v-if="!isLoggedIn"
          to="/admin"
          color="neutral"
          variant="ghost"
          label="Login"
          class="text-[#F189AC] hover:bg-[#F189AC]/15 hover:text-[#FCE7EE]"
        />

        <UButton
          v-else-if="onAdminRoute || isAdminView"
          color="neutral"
          variant="ghost"
          label="User View"
          class="text-[#F189AC] hover:bg-[#F189AC]/15 hover:text-[#FCE7EE]"
          @click="goUserView"
        />

        <UButton
          v-else
          color="neutral"
          variant="ghost"
          label="Admin View"
          class="text-[#F189AC] hover:bg-[#F189AC]/15 hover:text-[#FCE7EE]"
          @click="enterAdminView"
        />

        <UButton
          v-if="isLoggedIn"
          to="/admin/logout"
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
