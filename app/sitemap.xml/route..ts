// app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Set revalidation to one week (604800 seconds) if your data rarely changes.
export const revalidate = 604800;

export async function GET() {
  // Fetch sets and cards from the database
  const sets = await prisma.set.findMany({
    select: { id: true },
  });
  const cards = await prisma.card.findMany({
    select: { id: true },
  });

  // Build URLs for sets and cards.
  const setUrls = sets.map((set) => `/sets/${set.id}`);
  const cardUrls = cards.map((card) => `/card/${card.id}`);

  // Include the homepage plus the dynamic URLs.
  const allUrls = ['/', ...setUrls, ...cardUrls];

  // Generate the XML sitemap.
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      (url) => `
    <url>
      <loc>https://www.pokeshelf.com${url}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      // Cache the sitemap on the edge for one week, with a stale-while-revalidate period of 10 minutes.
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=600',
    },
  });
}
