# Materia — Product Catalog (Next.js 14)

A full-stack product catalog with role-based access control, built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Next.js Route Handlers (built-in, no Express needed)
- **Data**: In-memory store (swap for Prisma/MongoDB/Supabase)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

| User     | Password   | Permissions              |
|----------|------------|--------------------------|
| `admin`  | `admin123` | Create · Edit · Delete   |
| `editor` | `edit123`  | Create · Edit            |
| `viewer` | `view123`  | View only                |
| Guest    | —          | View only                |

## Project Structure

```
materia-catalog/
├── app/
│   ├── api/
│   │   ├── products/
│   │   │   ├── route.ts          # GET list, POST create
│   │   │   ├── [id]/route.ts     # GET, PUT, DELETE single
│   │   │   └── sync/route.ts     # POST bulk external sync
│   │   ├── categories/route.ts   # GET category list
│   │   └── stats/route.ts        # GET stats
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AuthScreen.tsx       # Login / guest access
│   ├── CatalogPage.tsx      # Main page orchestrator
│   ├── CrudModal.tsx        # Create/edit modal
│   ├── Header.tsx           # Top nav with user chip
│   ├── ProductCard.tsx      # Grid card
│   ├── ProductDetail.tsx    # Full-screen detail panel
│   ├── ProductRow.tsx       # List view row
│   ├── StatsStrip.tsx       # Stats bar
│   ├── ToastContainer.tsx   # Notifications
│   └── Toolbar.tsx          # Search, filters, actions
├── context/
│   ├── AuthContext.tsx      # Auth state & permissions
│   └── ToastContext.tsx     # Toast notifications
├── lib/
│   ├── auth.ts              # User store, permissions, helpers
│   ├── db.ts                # In-memory data layer
│   └── useProducts.ts       # Products hook (API calls)
└── types/
    └── index.ts             # TypeScript types
```

## Swapping to a Real Database

Edit `lib/db.ts` — replace the in-memory store with your ORM:

```ts
// MongoDB (Mongoose)
const product = await Product.findById(id)

// PostgreSQL (Prisma)
const product = await prisma.product.findUnique({ where: { id } })

// Supabase
const { data } = await supabase.from('products').select('*')
```

## Adding Real Auth

Replace `lib/auth.ts` user store with:
- **NextAuth.js** for OAuth (Google, GitHub)
- **Clerk** for drop-in auth
- **Supabase Auth** if using Supabase DB

Store the user's role in your database and return it from the session.

## External API Sync

Click **Sync** in the toolbar and paste any API URL that returns an array:
```json
[{ "Codes": "XYZ-001", "Category": "Wall", "ImageLink": "https://..." }]
```
Synced records are tagged as `source: "external"` and shown with a green badge.

## Deployment

```bash
npm run build
npm start
# or deploy to Vercel with zero config
```
