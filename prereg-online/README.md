# VisitTrack Pre-Registration (Online)

A minimal Next.js app for visitor pre-registration. Publicly hosted (e.g., on Vercel). Stores basic, non-sensitive data in Supabase. Staff import from VisitTrack LAN system.

## Environment

Create `.env.local` (not committed):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

These should be configured in Vercel Project Settings → Environment Variables.

## Supabase schema

Create table and RLS policies (see `../docs/prereg/schema.sql`). Ensure anonymous insert is allowed, and updates restricted to service role.

## Development

```
pnpm i # or npm i / yarn
pnpm dev
```

## Deploy to Vercel

- Connect this folder (`prereg-online/`) as the project root in Vercel.
- Framework preset: Next.js
- Build command: `next build`
- Output: `.next`
- Set env vars above.
