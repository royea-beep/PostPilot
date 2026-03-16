import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://postpilot.ftable.co.il', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://postpilot.ftable.co.il/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://postpilot.ftable.co.il/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
