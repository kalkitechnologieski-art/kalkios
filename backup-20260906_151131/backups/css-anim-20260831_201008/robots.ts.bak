export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/', '/unauthorized'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com'}/sitemap.xml`,
  }
}
