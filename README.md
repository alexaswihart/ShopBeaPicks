# ShopBeaPicks

Nuxt 4 + Nuxt UI blog, backed by Cloudflare D1 and R2, deployed to Cloudflare Pages. Owners sign in with Cloudflare Access (Google).

## Stack

- Nuxt 4 + Nuxt UI (`UEditor` for writing posts)
- Cloudflare Pages (Nitro `cloudflare_pages`)
- D1 for posts (drafts + published)
- R2 for uploaded images (external image URLs also supported)
- Cloudflare Access + Google IdP for admin

## Local setup

```bash
cp .env.example .env
npm install
npm run db:migrate:local
npm run dev
```

`.env` should include `NUXT_ADMIN_DEV_BYPASS=true` so `/admin` works without Access locally.

Then open:

- Feed: http://localhost:3000
- Admin: http://localhost:3000/admin

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Local Nuxt + Cloudflare bindings via `nitro-cloudflare-dev` |
| `npm run build` | Production Pages build (`dist/`) |
| `npm run db:migrate:local` | Apply D1 migrations to local DB |
| `npm run db:migrate:remote` | Apply D1 migrations to remote DB |
| `npm run deploy` | Migrate remote D1, build, deploy with Wrangler |

## GitHub → Cloudflare Pages (CI/CD)

Pushes to `main` run CI and deploy via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### 1. Create the GitHub repo and push

```bash
git checkout -b main
git add .
git commit -m "Initial commit: ShopBeaPicks Nuxt site"
gh repo create ShopBeaPicks --private --source=. --remote=origin --push
```

### 2. Cloudflare API token

1. Open [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**.
2. Use **Edit Cloudflare Workers** (or a custom token with Account → Cloudflare Pages:Edit, Account → D1:Edit, Account → Account Settings:Read).
3. Include account **BSwihart**.

### 3. GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions** → add:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | `28cc8a039635008353c70b138ee54b1b` |

After that, every push to `main` migrates D1, builds, and deploys to the **shopbeapicks** Pages project (`https://shopbeapicks.pages.dev`).

You can still deploy locally with `npm run deploy` when needed.

## Cloudflare resources (one-time)

Update [`wrangler.jsonc`](wrangler.jsonc) after creating real resources:

### 1. D1 database

```bash
npx wrangler d1 create shopbeapicks
```

Copy the returned `database_id` into `wrangler.jsonc` → `d1_databases[0].database_id`.

Apply migrations:

```bash
npm run db:migrate:remote
```

### 2. R2 bucket

```bash
npx wrangler r2 bucket create shopbeapicks-images
```

Keep the binding name `IMAGES` (already configured).

### 3. Pages bindings

If you deploy via the dashboard Git integration (not only `wrangler pages deploy`), also add the same D1 + R2 bindings under **Workers & Pages → your project → Settings → Bindings**.

## Cloudflare Access login (shopbeapicks.pages.dev)

Public site stays open. Only `/admin*` requires Access login (not `/api/*`).

### 1. Create Zero Trust (if needed)

1. Open [Zero Trust](https://one.dash.cloudflare.com/) and select **BSwihart**.
2. Create/choose a team name (current: `flat-wave-3363` → `flat-wave-3363.cloudflareaccess.com`).

### 2. Identity provider

**Fastest:** Cloudflare IdP — Zero Trust → **Integrations → Identity providers → Cloudflare** (often already present). Sign in with a Cloudflare account.

**Google (original plan):** create an OAuth Web client in [Google Cloud Console](https://console.cloud.google.com/) with:
- Origin: `https://<team>.cloudflareaccess.com`
- Redirect: `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`
Then add it under Zero Trust → **Identity providers → Google**.

### 3. Access application

Zero Trust → **Access controls → Applications → Add → Self-hosted**

Protect **only** this public hostname destination:

| Field | Value |
| --- | --- |
| Domain | `shopbeapicks.pages.dev` |
| Path | `/admin` |

If the UI allows wildcards or “path starts with”, use `/admin` so `/admin` and `/admin/posts/...` are covered. Some UIs need two destinations:

- `shopbeapicks.pages.dev/admin`
- `shopbeapicks.pages.dev/admin/*`

Do **not** add `/api/admin`. Do **not** put `https://` in the domain field.

If you deleted destinations and see “Unable to find your Access application”, recreate the self-hosted app with the destination above, keep your Allow email policy, then try https://shopbeapicks.pages.dev/admin again (full browser navigation, not a fetch).
**Policy:** Allow when email is an owner (or Cloudflare account member if using Cloudflare IdP). Enable your IdP; Instant Auth is fine with a single IdP.

### 4. Pages env vars + redeploy

Workers & Pages → **shopbeapicks** → **Settings → Environment variables** (Production):

```bash
NUXT_ADMIN_DEV_BYPASS=false
NUXT_ACCESS_ALLOWED_EMAILS=you@gmail.com,coowner@gmail.com
NUXT_PUBLIC_ACCESS_TEAM_DOMAIN=flat-wave-3363.cloudflareaccess.com
```

Then:

```bash
npm run deploy
```

**Login** goes to `/admin` (Access challenge). **Logout** appears once the team domain var is set. Local `.env` still uses `NUXT_ADMIN_DEV_BYPASS=true`; production uses `.env.production` / Wrangler vars (`false`).

## Content model

Posts in D1:

- `title`, `slug`, `excerpt` (feed snippet), `content` (markdown from `UEditor`)
- `cover_image` (R2 URL or external URL)
- `status`: `draft` | `published`
- `published_at` set on first publish

## Notes

- Replace the placeholder `database_id` in `wrangler.jsonc` before remote migrate/deploy.
- Keep `NUXT_ADMIN_DEV_BYPASS` off in production.
- Image uploads are capped at 5MB (`jpeg`, `png`, `gif`, `webp`, `svg`).
