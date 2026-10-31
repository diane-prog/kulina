# Kulina API

Kulina is the African cooking companion for everyone who wants to learn how to cook — young girls, women, teenagers, boys, men, and complete beginners. The API is built with NestJS and follows the same modular architecture and delivery workflow as the `finanxbk` reference project.

## What Kulina does

- Illustrated African recipes with ingredients, steps, tips, and FCFA cost estimates
- Video tutorials and guided cooking sessions
- Ingredient-based recipe search
- Weekly meal planning with budget control in FCFA
- Automatic shopping lists generated from meal plans
- Community feed: questions, tips, stories, comments, and likes
- Reviews and ratings
- Beginner-friendly assistant that suggests recipes and guidance
- Admin dashboard and role-based access control

## Stack

- NestJS 11 + TypeScript
- PostgreSQL + TypeORM
- Cloudinary file storage
- JWT authentication with Passport
- class-validator DTOs
- Swagger + ReDoc
- Winston logging
- Socket.IO notifications
- Jest + ts-jest

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm run start:dev
```

The API is exposed under `/api/v1`. The health check is available at `/ping`.

Swagger documentation is available at `/docs` when `ENABLE_SWAGGER=true`.

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
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

`DB_SYNC=true` is convenient for local development. Disable it in production and use migrations.

### File storage

Kulina uses **Cloudinary** for uploads. Files are uploaded under `kulina/<scope>` folders (`recipes`, `tutorials`, `avatars`, `community`, `ingredients`, `general`) and their metadata is stored in the `files` table. The upload controller lives in `src/core/cloudinary/cloudinary.controller.ts` and exposes the existing `/api/v1/files` routes.

## Main modules

| Module | Responsibility |
| --- | --- |
| `users` | Registration, login, profile, password reset, admin user management |
| `roles` | RBAC roles and seeding |
| `cloudinary` | Cloudinary file uploads and metadata |
| `cuisines` | African cuisines catalog |
| `recipe-categories` | Recipe categories catalog |
| `ingredients` | Ingredient catalog with average FCFA prices |
| `recipes` | Recipes, ingredients, steps, tips, search |
| `reviews` | Ratings and comments on recipes |
| `favorites` | Saved recipes |
| `tutorials` | Video tutorials |
| `cooking` | Guided cooking sessions |
| `meal-plans` | Weekly meal planning |
| `shopping-lists` | Shopping lists generated from meal plans |
| `community` | Posts, comments, likes |
| `budgets` | FCFA budget tracking |
| `assistant` | Beginner-friendly recipe and budget suggestions |
| `search` | Global search across recipes, tutorials, ingredients, and posts |
| `dashboard` | Admin statistics |

## Scripts

```bash
pnpm run start:dev
pnpm run build
pnpm run lint
pnpm run test
pnpm run test:e2e
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
