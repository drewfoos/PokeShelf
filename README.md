# PokéShelf - Pokémon TCG Collection Manager

PokéShelf is a web application for managing your Pokémon Trading Card Game collection. It allows users to browse card sets, search for cards, track their collection, and see current market prices.

![PokéShelf Logo](/public/pokeshelf-logo.svg)

## Features

- **Card Browsing**: Browse all Pokémon card sets and view detailed card information
- **Collection Tracking**: Add cards to your collection with specific variants, conditions, and quantities
- **Price Tracking**: See current market prices from TCGPlayer for your cards
- **User Authentication**: Secure user accounts with Clerk authentication
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Tech Stack

- **Frontend**:
  - Next.js 15 (App Router)
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Clerk for authentication

- **Backend**:
  - Next.js API Routes
  - MongoDB with Prisma ORM
  - Pokémon TCG API integration

- **Deployment**:
  - Vercel

## Project Structure

```
app/                          # Next.js App Router directories
  ├── api/                    # API routes
  │   ├── collection/         # Collection management endpoints
  │   ├── search/             # Card search endpoints
  │   └── webhooks/           # Authentication webhooks
  ├── card/                   # Card detail pages
  ├── collection/             # User collection pages
  ├── search/                 # Search pages
  ├── sets/                   # Set browsing pages
  └── sign-in, sign-up/       # Authentication pages
  
components/                   # React components
  ├── cards/                  # Card display components
  ├── collection/             # Collection management components
  ├── home/                   # Homepage components
  ├── layout/                 # Layout components (header, footer)
  ├── search/                 # Search components
  ├── sets/                   # Set display components
  ├── ui/                     # UI components (shadcn)
  └── wishlist/               # Wishlist components

lib/                          # Utility functions and services
  ├── auth.ts                 # Authentication helpers
  ├── prisma.ts               # Prisma client
  ├── services/               # Service layer
  │   └── pokemonTcgService.ts # Pokémon TCG API service
  └── utils.ts                # Utility functions

prisma/                       # Prisma ORM 
  └── schema.prisma           # Database schema

public/                       # Static assets

scripts/                      # Utility scripts
  ├── check-new-sets.ts       # Script to check for new card sets
  └── import-data.ts          # Data import script

types/                        # TypeScript type definitions
  ├── api/                    # API request/response types
  ├── card.ts                 # Card types
  ├── collection.ts           # Collection types
  ├── price.ts                # Price data types
  ├── set.ts                  # Set types
  ├── user.ts                 # User types
  └── utils.ts                # Utility types
```

## Core Models

### Cards

Cards represent individual Pokémon cards from the TCG. Each card belongs to a Set and has attributes like:
- **name**: The card's name
- **supertype**: The card's supertype (e.g., Pokémon, Trainer, Energy)
- **types**: The card's types (e.g., Fire, Water)
- **rarity**: The card's rarity (e.g., Common, Rare, Ultra Rare)
- **images**: Images of the card
- **tcgplayer**: Price data from TCGPlayer

### Sets

Sets represent official Pokémon TCG releases. Each set has attributes like:
- **name**: The set's name
- **series**: The set's series (e.g., Scarlet & Violet, Sword & Shield)
- **releaseDate**: When the set was released
- **totalCards**: How many cards are in the set

### UserCollection

Represents a user's card collection. Contains:
- **totalCards**: Total number of cards in the collection
- **uniqueCards**: Number of unique cards
- **estimatedValue**: Estimated market value of the collection

### UserCard

Represents a specific card in a user's collection. Attributes include:
- **quantity**: How many the user has
- **condition**: Card condition (Near Mint, Lightly Played, etc.)
- **variant**: Card variant (normal, holofoil, reverseHolofoil, etc.)
- **isFoil**: Whether the card is foil
- **isFirstEdition**: Whether the card is first edition

## Authentication

Authentication is handled via Clerk, with custom middleware to protect routes and API endpoints. The application includes:

- Custom auth helpers in `lib/auth.ts` for consistent auth handling
- Protected routes requiring authentication (collection)

## API Endpoints

### Collection Management
- `GET /api/collection/check` - Check if a card is in the collection
- `POST /api/collection/add` - Add a card to the collection
- `POST /api/collection/remove` - Remove a card from the collection

### Card/Set Data
- `GET /api/search` - Search for cards
- `GET /api/sets` - Get all sets

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Pokémon TCG API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pokeshelf.git
cd pokeshelf
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```
# .env.local
DATABASE_URL="mongodb://username:password@host:port/database?options"
POKEMON_TCG_API_KEY="your-api-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
SIGNING_SECRET="your-clerk-webhook-signing-secret"
```

4. Initialize the database:
```bash
npx prisma generate
```

5. Import initial data:
```bash
npm run import-data
```

6. Run the development server:
```bash
npm run dev
```

## Deployment

The application is designed to be deployed on Vercel. Connect your GitHub repository to Vercel and configure the environment variables.

## Regular Maintenance

1. Check for new sets:
```bash
npm run check-new-sets
```

2. Update card prices:
```bash
npm run update-prices
```

## License

This project is licensed under the MIT License.

## Acknowledgements

- Data provided by the [Pokémon TCG API](https://pokemontcg.io/)
- Card prices from [TCGPlayer](https://www.tcgplayer.com/)
- Pokémon is a trademark of Nintendo/Creatures Inc./GAME FREAK inc.
- This application is not affiliated with, endorsed, or sponsored by Nintendo or The Pokémon Company.
