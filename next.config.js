/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 14, no need for experimental.appDir
  
  // Suppress hydration warnings for attributes added by browser extensions
  reactStrictMode: true,
  
  // Custom webpack config to suppress specific hydration warnings
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Suppress hydration warnings for fdprocessedid attribute
      const originalWarn = console.warn
      console.warn = (...args) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('Extra attributes from the server') &&
          args[0].includes('fdprocessedid')
        ) {
          return // Suppress this specific warning
        }
        originalWarn.apply(console, args)
      }
    }
    return config
  }
}

module.exports = nextConfig 