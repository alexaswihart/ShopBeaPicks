// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nitro-cloudflare-dev'
  ],

  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error'
      ]
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Local-only: set NUXT_ADMIN_DEV_BYPASS=true in .env
    // Production builds use .env.production (false) + wrangler vars
    adminDevBypass: process.env.NUXT_ADMIN_DEV_BYPASS || 'false',
    accessAllowedEmails: process.env.NUXT_ACCESS_ALLOWED_EMAILS || '',
    // Optional: Access Application Audience (AUD) from Zero Trust app settings
    accessAud: process.env.NUXT_CF_ACCESS_AUD || '',
    public: {
      accessTeamDomain: process.env.NUXT_PUBLIC_ACCESS_TEAM_DOMAIN || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://shopbeapicks.pages.dev',
      siteName: 'ShopBeaPicks'
    }
  },

  nitro: {
    preset: 'cloudflare_pages',
    cloudflare: {
      deployConfig: true,
      wrangler: {
        // Keep wrangler.jsonc as source of truth for bindings
      }
    }
  },

  routeRules: {
    '/admin/**': { ssr: true },
    '/api/**': { prerender: false }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor'
      ]
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
