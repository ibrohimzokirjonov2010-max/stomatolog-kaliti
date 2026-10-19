# New Supabase project

StomaHub now expects an empty Supabase project in the owner's account (region **eu-central-1 / Frankfurt**). The old database is not migrated. Apply the schema yourself, then point Vercel at the new project.

## 1. Build the schema

In the Supabase dashboard: **Project Settings → Database → Connection string → URI**. Use the `postgres` role. Then:

```bash
openssl rand -hex 32
```

That value is the new `STOMAHUB_DB_SECRET`. Pass the same value to psql. Do not commit it.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v db_secret='THE_HEX_ABOVE' -f supabase/bootstrap.sql
```

`supabase/bootstrap.sql` is idempotent. Running it twice is safe. It refuses to run when `db_secret` is missing or shorter than 16 characters.

Do **not** run `supabase/local-supabase-stub.sql` on the hosted project. That file only creates `anon`, `authenticated`, `service_role`, `auth.uid()`, and the `storage` tables so the script can be tested on a local Postgres that is not Supabase.

### How `STOMAHUB_DB_SECRET` is checked

The secret is **not** stored as plaintext and it is **not** written into the SQL file.

`private.assert_secret(p_secret)` reads `private.app_config` where `key = 'server_secret_sha256'` and compares that value to:

```sql
encode(extensions.digest(p_secret, 'sha256'), 'hex')
```

Every server RPC sends `p_secret` from the env var `STOMAHUB_DB_SECRET`. The bootstrap script writes the hash from the psql variable `db_secret`. A second run updates the hash, which is how you rotate the secret.

`pgcrypto` is installed in the `extensions` schema (`extensions.digest`).

### What the script creates

Migrations in `supabase/migrations`, in filename order, including:

- profiles, community, orders, seller cabinet, bonuses, notifications
- storage buckets `community` (public), `product-docs` (public), `seller-docs` (private) and the upload-ticket policies (`sh_can_upload` / `sh_can_read`)
- platform store renamed to **StomaHub Market**, commission **12%** via `private.marketplace_commission_rate()`, bonus rules in `private.bonus_rules()`
- `site_settings` for contact email / phone / Telegram (empty until an admin saves them; the in-app form is the fallback)
- `20261019a` unpaid orders (`payment_state = awaiting_payment`, no `escrow_held` without a payment callback) and `crm_records`
- hot-query indexes (orders by buyer and seller, products by shop / category / `created_at`, community posts / comments / likes, CRM by doctor and kind, notifications by user and unread, surplus / masters / jobs / labs by status and `created_at`, profile phone / email / provider lookups, OTP and Telegram link tokens)
- books, courses, news, per-user book progress and course enrollment (`20261019b_books_courses_news.sql`), plus the public `library` storage bucket (covers, PDF, lesson video)

If `bootstrap.sql` was already applied, paste `supabase/migrations/20261019b_books_courses_news.sql` into the SQL editor as-is. It has no psql variables. Do not paste `bootstrap.sql` again unless you intend to reset the secret hash.

There is no sessions table. The browser cookie is an HMAC of `STOMAHUB_SESSION_SECRET`. Login lookups use `profiles`, `otp_codes`, and `telegram_link_tokens`.

## 2. Vercel environment variables

Set these on the Vercel project **Production** and **Preview** environments. Generate secrets with `openssl rand -hex 32`. Do not reuse the old database secret.

### Change for the new database

| Variable | Where the value comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |
| `STOMAHUB_DB_SECRET` | The hex you passed as `-v db_secret` when running `bootstrap.sql` |
| `STOMAHUB_SESSION_SECRET` | A **new** `openssl rand -hex 32`. This signs the `sh_session` cookie. Old cookies stop working, which is correct because the user ids will not exist in the new database. |

There is no `DATABASE_URL` on Vercel. The app talks to PostgREST with the anon key plus `STOMAHUB_DB_SECRET`. Do not add the service-role key.

### Leave as they are

| Variable | Why it stays |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client. Unchanged. |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username shown on the login page. |
| `TELEGRAM_BOT_TOKEN` | Same bot. |
| `TELEGRAM_WEBHOOK_SECRET` | Same webhook check, if it is set. |
| `NEXT_PUBLIC_TELEGRAM_LOGIN_ENABLED` | Feature flag. |
| `ADMIN_PHONES` | Owner phones. `sh_session_ping` promotes a matching verified phone to owner admin. **The first admin still gets in** after signing up or logging in with a phone in this list. No database row has to be inserted by hand. |
| `ADMIN_EMAILS` | Same promotion for a Google account whose email is in the list. |
| `ADMIN_TELEGRAM_IDS` | Same promotion for a Telegram login whose id is in the list. |
| `CRON_SECRET` | Protects `/api/cron/notify`. Unrelated to the database. |
| `OTP_TEST_SECRET` | Optional test OTP bypass. Unrelated to the database. |
| `NEXT_PUBLIC_SITE_URL` | Public site origin. |
| `TELEGRAM_GATEWAY_TOKEN` | Optional. When it is unset, registration still works without the Telegram Gateway. |

After saving the env vars, redeploy so the functions pick up the new URL, anon key, and secrets.

Functions run in **fra1** (`vercel.json` `regions`), next to the Frankfurt database.

## 3. First login

1. Redeploy.
2. Open the site and register with a phone that is listed in `ADMIN_PHONES` (or Google / Telegram if those admin lists match).
3. The session ping marks that account `is_admin` / `owner` and can claim the platform store.
4. Marketplace, seminars, channels, jobs, labs, masters, surplus, and community start empty until someone publishes a row.
