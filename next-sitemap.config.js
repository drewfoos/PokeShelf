// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.pokeshelf.com',
  generateRobotsTxt: true,
  additionalPaths: async () => {
    const prisma = require(`${process.cwd()}/lib/prisma`).default;
    // Fetch all sets and cards from your database
    const sets = await prisma.set.findMany({ select: { id: true } });
    const cards = await prisma.card.findMany({ select: { id: true } });
    
    return [
      ...sets.map(set => `/sets/${set.id}`),
      ...cards.map(card => `/card/${card.id}`)
    ];
  },
};
