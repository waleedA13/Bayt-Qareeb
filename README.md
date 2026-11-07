# 🏠 Bayt Qareeb

*by Manara West · Manara Network: Bridging Campuses track*

**Transferring from community college to a 4-year university means finding housing in a new city, often with strangers, and usually through scattered group chats.** Bayt Qareeb is a map-first housing and roommate finder where verified Muslim students list rooms with what actually matters (halal kitchen, brothers-only or sisters-only houses, your real share of the rent), so transfer students land somewhere safe before day one.

![Bayt Qareeb map with a listing open](docs/screenshot.jpg)

**🔗 Live demo:** https://manara-west.vercel.app (sign in with a `.edu` email, see [Testing the app](#-testing-the-app-judges-start-here))

---

## ⚡ Testing the app (judges, start here)

### 🛡️ Why you'll see a sign-in screen first
Bayt Qareeb has a strict **anti-creep gate**: only **verified `.edu` students** can see the map and listings. This keeps out scammers and strangers posing as roommates, and it protects the students whose contact details are on each listing.

- Sign-in uses **Clerk** with an emailed one-time code, which proves you own the inbox.
- After sign-in, the app checks that your **verified primary email ends in `.edu`** (`lib/auth.ts`).
- Anyone else gets a **"Students only"** screen, and `/api/listings` returns **403**.

### ✅ Option A: use your own `.edu` email (recommended)
1. Open **https://manara-west.vercel.app**
2. Enter your school email, e.g. `you@yourschool.edu`
3. Enter the 6-digit code from your inbox
4. You're in: the map and listings load

### 🧪 Option B: test email, no inbox needed
Our Clerk instance is in development mode, which supports [Clerk test emails](https://clerk.com/docs/testing/test-emails-and-phones):

| Field | Value |
|---|---|
| **Email** | `judge+clerk_test@demo.edu` |
| **Verification code** | `424242` |

> Any address containing `+clerk_test` works; no email is sent. If this doesn't work, test mode is off in the Clerk dashboard (**Configure → Settings → Test mode**), so use Option A.

### 🗺️ 60-second demo path
1. On the map, tap the **dot near Los Angeles**. The map flies in and price tags appear.
2. Tap the **$1.4K** pin (near UCLA). The details panel opens.
3. Check what generic listing sites don't show: **Brothers house**, **Halal kitchen**, **your share ($1,400) vs. the whole apartment ($4,200)**, and average utilities.
4. Use the filters: **Sisters**, **Halal kitchen**, **Up to $800**. The list and map update together.
5. Resize to phone width: you get a list/map toggle and a preview card when you tap a pin.

---

## 📋 Prerequisites
- **Node.js 20+** and **npm 10+** (`node -v`, `npm -v`)
- Free accounts for:
  - **Supabase** (Postgres database)
  - **Clerk** (authentication)
  - **Mapbox** (map tiles)

## 🔑 Environment variables
Copy `.env.example` to `.env` and fill in each value:

```bash
# Supabase → Connect → ORMs → Prisma
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Mapbox → Account → Access tokens (public "pk." token)
NEXT_MAPBOX_TOKEN="pk...."

# Clerk → Configure → API keys
NEXT_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Anthropic console → API keys (server-only, powers /api/search)
ANTHROPIC_API_KEY="sk-ant-..."
```

> 🔒 `CLERK_SECRET_KEY` and `ANTHROPIC_API_KEY` are secrets: never commit `.env`. It's already in `.gitignore`.

## 🚀 Local setup
**1. Clone and install dependencies**
```bash
git clone https://github.com/waleedA13/Bayt-Qareeb.git && cd Bayt-Qareeb && npm install
```

**2. Create your `.env`** (then fill it in as above)
```bash
cp .env.example .env
```

**3. Create the database tables**
```bash
npx prisma db push
```

**4. Load the demo listings** (Berkeley, UCLA and USC)
```bash
npm run seed
```

**5. Start the dev server**
```bash
npm run dev
```

Open **http://localhost:3000** and sign in with a `.edu` email.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run seed` | Load the demo listings |
| `npm run validate` | Check listing data for outliers |
| `npm run build` | Production build |

## ✨ Features
- 🗺️ **Zillow-style map + list:** price pins appear as you zoom in, and the list shows what's in view
- 🕌 **Deen-aware filters:** brothers/sisters/mixed house, halal kitchen, private room, pets, max price
- 💵 **Honest costs:** your rent share, average utilities, estimated total, and the whole apartment's rent
- 🎓 **Verified listers:** every card shows the campus that verified the lister (e.g. *Verified at ucla.edu*)
- 📱 **Responsive:** phone, iPad and desktop layouts, 44px tap targets, reduced-motion support
- 🛡️ **`.edu`-only access** enforced on both pages and API routes

## 🔄 CI/CD
Every push and pull request runs **GitHub Actions**:
- data validation (no negative rent, rent over $10,000, or missing coordinates)
- `npm audit`
- a production build
- a **gitleaks** secret scan
- **CodeQL** security analysis

Actions are pinned to commit SHAs and run with read-only permissions. **Vercel** deploys `main` automatically.

## 🛠️ Built with
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Mapbox via `react-map-gl`
- **Backend:** Next.js API routes, Prisma ORM, Supabase Postgres
- **Auth:** Clerk (email one-time code), restricted to verified `.edu` emails
- **AI:** Anthropic Claude (`/api/search`, turns a plain-English search into filters)
- **DevOps:** GitHub Actions, Dependabot, Vercel

## 👥 Team
- **Waleed A**: frontend, map UI, design ([@waleedA13](https://github.com/waleedA13))
- **Aditya Jadhav**: CI/CD and auth gate ([@AdityaJadhav17](https://github.com/AdityaJadhav17))
- **Abas Mohamed**: backend, database and auth ([@ver1log](https://github.com/ver1log))
