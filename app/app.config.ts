export default defineAppConfig({
  ui: {
    colors: {
      primary: 'navy',
      secondary: 'blush',
      tertiary: 'sky',
      // Route default/neutral chrome through primary so grays aren't used
      neutral: 'navy'
    },
    // Show the mode you'll switch to: moon in light, sun in dark
    icons: {
      light: 'i-lucide-moon',
      dark: 'i-lucide-sun'
    }
  }
})
