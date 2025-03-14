// app/sitemap.ts
import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Query all sets from your database
  const sets = await prisma.set.findMany({
    select: { id: true },
  })

  // Define the homepage entry
  const home = {
    url: 'https://www.pokeshelf.com',
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }

  // Map over sets to build their URLs
  const setUrls = sets.map(set => ({
    url: `https://www.pokeshelf.com/sets/${set.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [home, ...setUrls]
}
