export default defineAppConfig({
  ui: {
    colors: {
      primary: 'navy',
      secondary: 'blush',
      tertiary: 'sky',
      // Route default/neutral chrome through primary so grays aren't used
      neutral: 'navy'
    },
    header: {
      slots: {
        root: 'bg-navy-600 border-navy-700',
        left: 'text-canvas',
        center: 'text-canvas',
        right: 'text-canvas',
        toggle: 'text-canvas hover:text-secondary hover:bg-transparent',
        content: 'w-3/4 max-w-[75%]',
        header: 'bg-navy-600 border-navy-700 text-canvas'
      }
    },
    // Show the mode you'll switch to: moon in light, sun in dark
    icons: {
      light: 'i-lucide-moon',
      dark: 'i-lucide-sun'
    },
    // Replace Nuxt UI's loose *:my-5 / leading-7 so edit matches published spacing
    editor: {
      slots: {
        base: (defaults: string) =>
          defaults
            .replaceAll('*:my-5', '*:my-0')
            .replaceAll('[&_p]:leading-7', '[&_p]:leading-normal')
            .replaceAll('sm:px-8', '')
            .replaceAll('[&_li]:my-1.5', '[&_li]:my-0')
            .replaceAll('[&_a]:text-primary', '[&_a]:text-secondary')
            .replaceAll('[&_a]:hover:border-primary', '[&_a]:hover:border-secondary')
      }
    }
  }
})
