# Invoicer

Multi-tenant invoicing + WhatsApp billing for small shops. Free to run on
Firebase Spark plan + Vercel free tier.

## What's included

- Public landing page (`/`)
- Shop owner signup/login (`/login`)
- Shop dashboard with multi-product invoice form + auto-calculated total (`/dashboard`)
- Each invoice is sent to the customer's WhatsApp with a link to a
  public, permanent invoice page (`/invoice/[id]`)
- Admin panel (`/admin`) — visible only to the email in `NEXT_PUBLIC_ADMIN_EMAIL`,
  shows every shop, every invoice, total revenue, with no 30-day limit
- Shop owners themselves only ever see their **last 30 days** of invoices
- Firestore security rules enforce all tenant isolation and admin access
  server-side — not just hidden UI

## 1. Install

```bash
npm install
```

## 2. Firebase project setup

1. Go to https://console.firebase.google.com → Create project.
2. **Authentication** → Sign-in method → enable Email/Password and Google.
3. **Firestore Database** → Create database → production mode.
4. Project Settings → General → "Your apps" → Add web app → copy the config.
5. Authentication → Settings → Authorized domains → add `localhost` (already
   there) and later your Vercel domain.

## 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Firebase config values, and set `NEXT_PUBLIC_ADMIN_EMAIL` to
**your own email** — this is the only account that can open `/admin`.

## 4. Update Firestore rules with your admin email

Open `firestore.rules` and replace:

```
request.auth.token.email == "you@example.com"
```

with your real admin email (must match `NEXT_PUBLIC_ADMIN_EMAIL` exactly).

Deploy the rules using the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project, keep default file names
firebase deploy --only firestore:rules,firestore:indexes
```

(Or paste `firestore.rules` directly into Firebase Console → Firestore →
Rules tab → Publish.)

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up as a shop owner, create an invoice,
and watch it open WhatsApp with the message + invoice link pre-filled.

Then sign up or log in with the email you set as `NEXT_PUBLIC_ADMIN_EMAIL`
and visit `/admin` to see the full cross-shop view.

## 6. Deploy to Vercel

```bash
git init
git add .
git commit -m "Invoicer"
git remote add origin <your-github-repo-url>
git push -u origin main
```

1. Go to https://vercel.com → New Project → import your repo.
2. Add all the same environment variables from `.env.local` under
   Project Settings → Environment Variables.
3. Deploy.
4. Go back to Firebase Console → Authentication → Settings →
   Authorized domains → add your `your-app.vercel.app` domain, or login
   will fail with `auth/unauthorized-domain`.

## How the pieces fit together

- **Multi-tenancy**: every invoice is written with `shopId: user.uid`.
  Firestore rules check this field on every `create`, `list`, `update`,
  and `delete` — a shop's dashboard query can never return another
  shop's data even if someone tampered with the client-side request.
- **Public invoice link**: `/invoice/[id]` is unauthenticated and reads a
  single invoice by its exact document ID (`allow get: if true`). It can
  never be used to list or browse other invoices, since Firestore
  security rules distinguish `get` (single doc) from `list` (query).
- **30-day retention for shops**: `subscribeToShopInvoices` in
  `src/lib/invoices.js` filters `timestamp >= 30 days ago`. This is a
  product choice, not a security rule — it keeps free-tier Firestore
  reads small as a shop's history grows.
- **Admin**: `subscribeToAllInvoices` has no date or shopId filter at all.
  Access is gated by `ADMIN_EMAIL` both in the UI (`ProtectedRoute`) and
  in Firestore rules (`isAdmin()`), so the restriction can't be bypassed
  by calling Firestore directly.

## Suggested next features

- CSV export of invoices (admin and shop level)
- Editable shop settings (logo, address, GST number) shown on the public
  invoice page
- Invoice PDF download button on `/invoice/[id]`
- Per-shop custom WhatsApp message templates
