# Kulina Implementation Plan

## Goal

Build the Kulina NestJS backend following the `finanxbk` architecture and workflow, with African recipes, FCFA budgets, guided cooking, meal planning, shopping lists, community, and beginner guidance.

## 1. Foundation

- [x] Configure package.json, TypeScript, ESLint, Prettier, env example
- [x] Add common infrastructure: database abstraction, response envelope, validation pipe, error handler, logger, cache, mailer
- [x] Add config files and app bootstrap
- [x] Add JWT auth guards, roles guard, decorators
- [x] Add Swagger/ReDoc and CORS helpers

## 2. Identity and catalog

- [x] Users module: register, login, me, profile, password, admin management
- [x] Roles module with seeder
- [x] Cloudinary module with uploads and controller in the same folder
- [x] Cuisines module with seeder
- [x] Recipe categories module with seeder
- [x] Ingredients module with seeder and FCFA average prices

## 3. Cooking domain

- [x] Recipes module: entities, DTOs, repositories, CRUD, publish, search, ingredient search
- [x] Reviews module: rating, comment, aggregate update
- [x] Favorites module: save/unsave recipes
- [x] Tutorials module: video tutorials CRUD and search
- [x] Cooking module: guided sessions and progress
- [x] Meal plans module: CRUD, weekly generation, budget summary
- [x] Shopping lists module: CRUD and generation from meal plan
- [x] Community module: posts, comments, likes, feed
- [x] Budgets module: FCFA budgets and summaries

## 4. Intelligence and admin

- [x] Assistant module: recipe suggestions, beginner tips, budget guidance
- [x] Search module: global search
- [x] Dashboard module: admin statistics
- [x] Seeders registered at startup
- [x] README and architecture documentation

## 5. Verification

- [x] `pnpm install`
- [x] `pnpm run build`
- [x] `pnpm run lint`
- [x] `pnpm run test` (18 tests passing)
- [x] `pnpm run test:e2e` (1 test passing)
- [x] Smoke test `/ping` (covered by the e2e test)

## Review

### What was validated

- The full NestJS project compiles with `pnpm run build`.
- ESLint and Prettier pass with `pnpm run lint`.
- Unit tests pass: 6 suites, 18 tests.
- E2E test passes for `/ping`.
- Seeders cover roles, cuisines, recipe categories, and common ingredients with FCFA reference prices.
- Module wiring follows the `finanxbk` conventions: controllers only inject services, services orchestrate repositories, entities extend `AbstractEntity`, repositories extend `AbstractRepository`.
- File storage was migrated from local uploads to **Cloudinary**. The controller lives in `src/core/cloudinary/cloudinary.controller.ts`, the service wraps the Cloudinary SDK, and the `files` table stores Cloudinary metadata.
- A real Cloudinary upload + deletion smoke test succeeded against the configured account (`kulina/general`).

### Runtime note

The API expects PostgreSQL (`DB_*` variables). Start a PostgreSQL instance, copy `.env.example` to `.env`, then run `pnpm run start:dev`. Swagger is available at `/docs` when `ENABLE_SWAGGER=true` or `NODE_ENV=dev`.

### Final status

Complete for the initial Kulina backend scope.
