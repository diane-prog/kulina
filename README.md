# Chef en poche — Kulina API

Chef en poche is the Kulina API for Benin and Togo. It helps complete beginners cook African recipes step by step, with images, timers, a premium AI cooking assistant, photo checks, and a FCFA/XOF budget. The backend is built with NestJS and follows the same modular architecture and delivery workflow as the `finanxbk` reference project.

## What the API does

- Recipes with country (`BJ`, `TG`, `BOTH`) and category, ingredients, steps, timers, tips, and common cooking issues
- Ingredient-based recipe search and XOF budget filtering
- Guided cooking sessions with step tracking, timers, and session messages
- Premium AI assistant with rules-first answers, Gemini fallback, quotas, and photo checks
- Cloudinary signed uploads and media cleanup
- Admin recipe import (YAML/JSON) and publish workflow
- Free and premium plans with a Mobile Money payment scaffold
- Community, reviews, favorites, tutorials, meal plans, shopping lists, and budgets

## Stack

- NestJS 11 + TypeScript
- PostgreSQL + TypeORM
- Redis (cache, quotas, locks; in-memory fallback for local dev)
- Cloudinary media storage
- Gemini API (`@google/genai`) with streaming and JSON validation
- BullMQ AI jobs with retry and rate limiting
- Redis recipe/session caches, quotas, locks, and Socket.IO adapter
- Socket.IO cooking namespace
- JWT access + refresh tokens
- `@nestjs/throttler` rate limiting
- class-validator DTOs, Swagger, Winston
- Jest + ts-jest

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm run start:dev
```

The API is exposed under `/api/v1`. The health check is available at `/ping`.

Swagger documentation is available at `/docs` when `ENABLE_SWAGGER=true` or `NODE_ENV=dev`.

## Environment

See `.env.example` for the complete list. The most important variables are:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kulina
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=
```

`DB_SYNC=true` is convenient for local development. Disable it in production and use migrations. Generate a baseline migration from the current entities before the first production deployment:

```bash
pnpm typeorm migration:generate src/libs/database/migrations/InitialSchema
pnpm migration:run
```

## Media

Kulina uses **Cloudinary**. The media module lives in `src/core/media` and exposes:

- `POST /api/v1/media/sign` — signed direct upload
- `POST /api/v1/media/confirm` — persist `publicId` and URL after upload
- `POST /api/v1/media/upload` — API upload fallback
- `GET /api/v1/media/:id`
- `GET /api/v1/media` and `DELETE /api/v1/media/:id` (admin)

Files are uploaded under `kulina/<scope>` folders (`recipes`, `tutorials`, `avatars`, `community`, `ingredients`, `user-checks`, `general`).

## Core routes

### Auth and users

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` (email or phone in `identity`)
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET/PATCH /api/v1/users/me`
- `GET /api/v1/users` (admin)

### Recipes and ingredients

- `GET /api/v1/recipes?query=&country=&category=&maxBudgetXof=&page=`
- `GET /api/v1/recipes/:slug`
- `POST /api/v1/recipes/search-by-ingredients`
- `GET /api/v1/ingredients?query=`
- `POST /api/v1/recipes` (authenticated)
- `PATCH /api/v1/recipes/:id`
- `PATCH /api/v1/recipes/:id/status`
- `DELETE /api/v1/recipes/:id`

### Sessions and AI

- `POST /api/v1/sessions`
- `GET /api/v1/sessions/:id`
- `PATCH /api/v1/sessions/:id/step`
- `POST /api/v1/sessions/:id/next`
- `POST /api/v1/sessions/:id/previous`
- `POST /api/v1/sessions/:id/finish`
- `POST /api/v1/sessions/:id/abandon`
- `GET/POST /api/v1/sessions/:id/messages`
- `POST /api/v1/sessions/:id/photo-check` (premium)
- `POST /api/v1/ai/chat` (premium fallback)
- WebSocket namespace `/cooking`

### Admin

- `GET /api/v1/admin/recipes`
- `GET /api/v1/admin/recipes/:id`
- `POST /api/v1/admin/recipes`
- `PATCH /api/v1/admin/recipes/:id`
- `DELETE /api/v1/admin/recipes/:id`
- `POST /api/v1/admin/recipes/import`
- `POST /api/v1/admin/recipes/import-bulk`
- `PATCH /api/v1/admin/recipes/:id/publish`

At startup, the **bouillie de riz** pilot recipe is seeded in `review` status. Validate it with a local cook, then publish it with the admin endpoint.

### Plans and payments

- `GET /api/v1/plans`
- `POST /api/v1/subscriptions/checkout`
- `POST /api/v1/webhooks/payments`

## Main modules

| Module | Responsibility |
| --- | --- |
| `auth` | Register, login, refresh tokens, logout, current user |
| `users` | Profiles, roles, premium plan, admin user management |
| `media` | Cloudinary signed uploads, metadata, cleanup |
| `ingredients` | Ingredients, local names, XOF reference prices |
| `recipes` | Recipes, steps, tips, issues, search |
| `sessions` | Cooking sessions, step timers, session messages |
| `chat` | Socket.IO `/cooking` gateway |
| `ai` | Rules-first assistant, Gemini, quotas, photo checks |
| `subscriptions` | Plans, payments, premium access |
| `admin` | Recipe import, review, publish |
| `reviews` | Ratings and comments |
| `favorites` | Saved recipes |
| `tutorials` | Video tutorials |
| `meal-plans` | Weekly meal planning |
| `shopping-lists` | Shopping lists from meal plans |
| `community` | Posts, comments, likes |
| `budgets` | Food budget tracking |
| `search` | Global search |
| `dashboard` | Admin statistics |

## Testing and deployment

```bash
pnpm run lint
pnpm run test
pnpm run test:e2e
pnpm run build
```

The backend ships with a multi-stage `Dockerfile`, `docker-compose.yml` (API, PostgreSQL, Redis), and a GitHub Actions CI workflow.

## Scripts

```bash
pnpm run start:dev
pnpm run build
pnpm run lint
pnpm run test
pnpm run test:e2e
pnpm run migration:run
```

## Project conventions

- All entities extend `AbstractEntity`
- All repositories extend `AbstractRepository`
- Controllers only inject services
- Business rules live in services
- DTOs are documented with Swagger decorators
- Every function has English JSDoc
- Successful responses are wrapped as `{ statusCode, data }`

## License

UNLICENSED
