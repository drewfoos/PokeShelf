// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://www.pokeshelf.com',
  generateRobotsTxt: true,
  additionalPaths: async () => { // Remove unused config parameter
    const prisma = require('./lib/prisma').default;
    const sets = await prisma.set.findMany({ select: { id: true } });
    const cards = await prisma.card.findMany({ select: { id: true } });
    
    return [
      ...sets.map(set => `/sets/${set.id}`),
      ...cards.map(card => `/card/${card.id}`)
    ];
  },
};