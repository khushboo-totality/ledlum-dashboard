const fs = require('fs')
const path = require('path')

console.log('🗑️ Removing API routes for static export...')

const apiDir = path.join(process.cwd(), 'app/api')
const productsDir = path.join(process.cwd(), 'app/products')
const categoriesDir = path.join(process.cwd(), 'app/categories')
const statsDir = path.join(process.cwd(), 'app/stats')
const vendorsDir = path.join(process.cwd(), 'app/vendors')

// Remove API and dynamic routes
if (fs.existsSync(apiDir)) {
  fs.rmSync(apiDir, { recursive: true, force: true })
  console.log('✅ Removed app/api')
}
if (fs.existsSync(productsDir)) {
  fs.rmSync(productsDir, { recursive: true, force: true })
  console.log('✅ Removed app/products')
}
if (fs.existsSync(categoriesDir)) {
  fs.rmSync(categoriesDir, { recursive: true, force: true })
  console.log('✅ Removed app/categories')
}
if (fs.existsSync(statsDir)) {
  fs.rmSync(statsDir, { recursive: true, force: true })
  console.log('✅ Removed app/stats')
}
if (fs.existsSync(vendorsDir)) {
  fs.rmSync(vendorsDir, { recursive: true, force: true })
  console.log('✅ Removed app/vendors')
}

// Restore static export config
const configPath = path.join(process.cwd(), 'next.config.js')
const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  trailingSlash: true,
}

module.exports = nextConfig`

fs.writeFileSync(configPath, configContent)

console.log('🔧 Next.js config updated for static export')
console.log('🚀 Ready for static export - API routes removed')
