# Chef en poche — Kulina API Plan

## Goal

Build the NestJS backend for Chef en poche (Benin + Togo), following the `finanxbk` architecture and the `Chef en poche — Dossier technique` specification.

## 1. Foundation

- [x] NestJS, TypeScript, ESLint, Prettier, env example
- [x] Database abstraction, response envelope, validation pipe, error handler, logger, cache, mailer
- [x] JWT access + refresh tokens, roles, premium guard
- [x] Swagger/ReDoc and CORS
- [x] Redis service with in-memory fallback
- [x] Gemini service and AI quota service

## 2. Identity and media

- [x] `auth` module: register, login, refresh, logout, me
- [x] `users` module: profile, admin, plan/premium fields
- [x] `roles` module with seeder
- [x] `media` module: signed upload, confirm, direct upload, cleanup
- [x] `ingredients` module: local names, XOF prices, seeder

## 3. Cooking domain

- [x] `recipes` module: country + category, steps, issues, tips, search
- [x] `sessions` module: cooking sessions, step tracking, messages
- [x] `chat` module: Socket.IO `/cooking` gateway
- [x] `ai` module: rules-first answers, Gemini fallback, quotas, photo checks
- [x] `reviews`, `favorites`, `tutorials`, `meal-plans`, `shopping-lists`, `community`, `budgets`
- [x] `search` and `dashboard`

## 4. Admin and monetization

- [x] `admin` module: recipe import (YAML/JSON), publish
- [x] Bouillie de riz pilot recipe seeded in review status
- [x] `subscriptions` module: plans, checkout, signed payment webhooks
- [x] 50-recipe catalog seeded as published and idempotent (`seeds/recipe-catalog.seed.ts`)
- [x] Mobile Money provider abstraction: `manual` plus generic HTTP provider (MTN MoMo, Moov, Wave) with HMAC SHA-256 webhooks
- [x] Voice script endpoint `GET /sessions/:id/voice` backed by `RecipeStep.narrationText`/`audioUrl`
- [x] README, CLAUDE.md, .env.example, Dockerfile
- [x] pg_trgm migration and TypeORM data source

## 5. Verification

- [x] `pnpm install`
- [x] `pnpm run build`
- [x] `pnpm run lint`
- [x] `pnpm run test` (29 tests)
- [x] `pnpm run test:e2e` (1 test)
- [x] Temporary PostgreSQL integration test: app boot, seeders, phone register/login/refresh, admin publish, public recipe, media sign, session creation, messages, AI rules-first
- [x] 50-recipe catalog seeded and publicly listed (50 published + 1 review)
- [x] Checkout with the `manual` provider returns instructions and a reference; a `paid` webhook upgrades the user to `premium` until `premiumUntil`
- [x] Voice endpoint returns one narration entry per recipe step
- [x] Two consecutive boots against the same database leave the recipe counts unchanged (seed idempotency)

## Review

### What was validated

- The full project compiles, lints, and passes unit/e2e tests.
- The app boots against a temporary PostgreSQL instance.
- Seeders create roles, ingredients, and the bouillie de riz recipe in `review` status.
- First registered user receives `super_admin`.
- Access + refresh tokens work, including refresh rotation.
- Admin publish changes the recipe to `published` and the public slug route works.
- Cloudinary signed upload returns a valid signature payload.
- Cooking sessions, step tracking, and session messages work.
- Premium gating returns 403 for free users.
- AI rules-first matching returns the correct recipe issue fix without Gemini.
- Redis falls back to memory when `REDIS_URL` is empty.
- Redis recipe cache, session state, AI context cache, quotas, and locks are implemented.
- BullMQ AI queue with retry/backoff is implemented; it falls back to direct execution without Redis.
- `@nestjs/throttler` global rate limiting is enabled.
- Phone-only registration and login work.
- Admin CRUD and bulk YAML/JSON import are available.
- Cloudinary optimized delivery URLs use `f_auto,q_auto,w_600`.
- `recipe_steps(recipeId, position)` index and `pg_trgm` migration exist; ingredient/issue searches use `ILIKE` with pg_trgm-compatible indexes.
- Docker Compose (API, PostgreSQL, Redis) and GitHub Actions CI are present.
- The seeded catalog exposes 50 published recipes for BJ/TG, and every seed slug matches the slug generated from its title (including `Œufs brouillés` → `oeufs-brouilles`).
- Manual Mobile Money checkout and the signed webhook flow were exercised end to end through HTTP.
- `GET /sessions/:id/voice` returns `narrationText` for each step and falls back to the step instruction when no narration is authored.
- The 50-recipe catalog is idempotent across restarts.

### Remaining next steps

- Add server-side TTS or keep voice on the client with `expo-speech`.
- Generate and run full schema migrations before production.
- Add real Gemini and real Redis/BullMQ smoke tests once infrastructure is available.
- Grow the catalog from 50 to 200 recipes and have local cooks validate them.
- Build the Next.js and React Native frontends.
- Connect real Mobile Money credentials (MTN MoMo, Moov, or Wave) and test against the provider sandbox.

### How to finish the remaining work

#### 1. 50 then 200 recipes

1. Create one YAML file per recipe in `src/core/admin/seeds/recipes/`.
2. Use the bouillie de riz structure: `slug`, `title`, `country`, `category`, `baseServings`, `ingredients`, `steps`, `issues`.
3. Validate each recipe with a local cook before publishing.
4. Import one recipe:
   ```bash
   curl -X POST /api/v1/admin/recipes/import -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"yaml\":\"<yaml>\"}"
   ```
5. Import many recipes:
   ```bash
   curl -X POST /api/v1/admin/recipes/import-bulk -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"recipes\":[\"<yaml1>\",\"<yaml2>\"]}"
   ```
6. Recipes are imported as `review`; publish them with `PATCH /api/v1/admin/recipes/:id/publish`.

Content target: 50 recipes first, then 200 using the distribution from the technical dossier (pasta/cereals, sauces, rice/beans, fish/meat, vegetables, porridges, snacks, drinks).

#### 2. Real Mobile Money

1. Choose a provider (MTN MoMo, Moov Money, Wave).
2. Add provider credentials to `.env` (never commit them).
3. Create a provider adapter in `src/core/subscriptions/providers/` implementing `createCheckout()` and `verifyWebhook()`.
4. Call the provider sandbox from `SubscriptionsService.checkout`.
5. Verify signatures in `POST /webhooks/payments` before marking a payment as `paid`.
6. Test with the provider sandbox, then switch to production credentials.

#### 3. Voice

The dossier targets voice on the mobile side with `expo-speech`:

1. In the React Native app, read the current `RecipeStep.narrationText`.
2. Call `Speech.speak(step.narrationText, { language: 'fr-FR' })`.
3. Add play/pause/stop controls and a speed selector.
4. Keep the backend `narrationText` field as the source of truth.
5. Add server-side TTS later only if you need a consistent premium voice.

#### 4. Frontends

Build the Next.js web app and the React Native Expo app in separate repositories. They consume the `/api/v1` REST API and the `/cooking` WebSocket namespace.

### Final status

The backend MVP for Chef en poche is functional and tested: 50 seeded recipes, guided sessions, rules-first AI, Mobile Money checkout with signed webhooks, and a voice narration endpoint. Frontends, the remaining 150 recipes, real provider credentials, and client-side speech synthesis remain outside this backend scope.
