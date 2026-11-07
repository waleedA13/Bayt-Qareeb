# Manara West

**Find a roommate who shares your deen, on a map.**

Manara is a Zillow-style roommate finder for Muslim college students. Browse rooms on a full-screen map, tap a price pin, and see what matters: private or shared room, your actual share of the rent, average utilities, halal kitchen, pets, and whether the place is brothers-only or sisters-only.

## Anti-creep gate: `.edu` only

Only verified college emails (`*.edu`) can sign up. Everyone on the platform is a student, which keeps out scammers and strangers posing as roommates.

- Server-side check in `app/api/signup/route.ts` rejects any email that doesn't end in `.edu`.
- In production, email verification (magic link / OTP) proves the student owns the inbox.

## Features
- Full-screen Mapbox map with price-tag pins
- Listing sidebar: room setup, capacity, total rent vs. your share, utilities, house rules
- Gender preference (brothers / sisters / any), halal kitchen, pets
- CI pipeline that blocks bad seed data (negative rent, rent > $10k, missing coordinates)

## Stack
Next.js 14 (App Router) · Prisma + SQLite · react-map-gl + Mapbox · Tailwind CSS · GitHub Actions

## Run locally
```bash
npm install
cp .env.example .env        # then paste your Mapbox token
npx prisma db push
npm run seed
npm run dev
```
Open http://localhost:3000

Get a free Mapbox token at https://account.mapbox.com/access-tokens/

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run seed` | Load sample listings |
| `npm run validate` | Check seed data for outliers |
| `npm run build` | Production build |
