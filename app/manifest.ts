import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://12skins.com'
  
  return {
    name: '12SKINS診断サイト',
    short_name: '12SKINS',
    description: 'Your Skin,Your Story　心身ともに美しい人生を実現しましょう。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
