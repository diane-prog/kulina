# CLAUDE.md

This file provides guidance to Claude Code (or any AI coding agent) when working with code in this repository.

## Project

**Kulina** is a NestJS REST API that helps beginners — young girls, women, teenagers, boys, men, and everyone who wants to learn — cook with confidence. It is inspired by Tasty and Kitchen Stories and focuses on:

- illustrated African recipes with step-by-step instructions;
- video tutorials and guided cooking sessions;
- ingredient-based search;
- weekly meal planning and automatic shopping lists;
- a community for questions, tips, and recipe sharing;
- budgets expressed in **FCFA**;
- personalized guidance for beginners.

## Commands

### Development
- `pnpm run start:dev` - Start development server with watch mode
- `pnpm run start:debug` - Start with debug mode

### Build & Production
- `pnpm run build` - Compile TypeScript to `dist/`
- `pnpm run start:prod` - Run production build (`node dist/main`)

### Testing
- `pnpm run test` - Run unit tests (Jest with ts-jest)
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run test:cov` - Generate coverage report

### Code Quality
- `pnpm run lint` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier (single quotes, 4-space tabs)

### Docker
- Multi-stage Dockerfile using `node:lts-alpine`
- pnpm is the package manager
- Healthcheck endpoint: `/ping`

## Architecture

The application follows the same modular NestJS architecture as the `finanxbk` reference project.

### Module Structure

- **`src/core/`** - Business domain modules
    - Each module contains: `entities/`, `dto/`, `repositories/`, `services/`
    - Standard pattern: `{name}.module.ts`, `{name}.controller.ts`, `{name}.service.ts`
    - Main domains: users, roles, cloudinary, cuisines, recipe-categories, ingredients, recipes, reviews, favorites, tutorials, cooking, meal-plans, shopping-lists, community, budgets, assistant, search, dashboard

- **`src/libs/`** - Infrastructure and shared libraries
    - `database/` - TypeORM configuration with `AbstractEntity` and `AbstractRepository`
    - `cache/` - In-memory cache with TTL
    - `mailer/` - Nodemailer wrapper (safe no-op when SMTP is not configured)

- **`src/helpers/`** - Cross-cutting helpers
    - `password_hash/` - bcrypt password hashing
    - `websocket/` - Socket.IO gateway and event helpers
    - `api_documentation/` - Swagger and ReDoc configuration
    - `cors.config.ts` - Environment-specific CORS

- **`src/common/`** - Shared application utilities
    - `decorators/` - Public, roles, pagination
    - `guards/` - JWT auth, JWT strategy, roles
    - `interceptors/` - Circular reference protection
    - `logger/` - Winston logger module
    - `response/` - Standardized response envelope, validation pipe, error handling
    - `enum/` - Shared enums
    - `seeder/` - Global seeders

- **`src/config/`** - Typed configuration with `@nestjs/config` `registerAs`

### Data Layer Patterns

**All entities extend `AbstractEntity<T>`** from `src/libs/database/abstract.entity.ts`:
- UUID primary key
- `deleted` flag for soft-delete
- `createdAt`, `updatedAt`, `deletedAt` timestamps
- Constructor pattern: `constructor(entity: Partial<T>)`

**All repositories extend `AbstractRepository<T>`** from `src/libs/database/abstract.repository.ts`:
- Standard CRUD: `find()`, `findOne()`, `create()`, `save()`, `update()`, `delete()`, `softDelete()`, `restore()`
- Helpers: `retrieveEntity()`, `retrieveEntities()` with automatic `deleted: false` filtering

**Database module registration**:
```typescript
imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Entity1, Entity2]),
]
```

### Strict Architectural Rules (CRITICAL)

1. **Repositories are FORBIDDEN in Controllers** — controllers only inject services.
2. **EntityManager stays in Repositories** — never inject it in services or controllers.
3. **Separation of concerns** — controller handles HTTP, service owns business logic, repository owns persistence.
4. **One export per file** — except barrels such as `config/index.ts`.
5. **English only in code** — identifiers, comments, JSDoc, log messages, error messages, tests, and commits.
6. **Every function has English JSDoc** — describe intent, parameters, return values, and thrown errors.
7. **Business logic lives in services** — avoid orphan util files unless there is real cross-cutting reuse.
8. **DTOs use class-validator** and `@ApiProperty()` for Swagger.

### Authentication

- JWT via Passport + `passport-jwt`
- `JwtAuthGuard` protects routes by default when applied
- `@Public()` marks open routes
- `RolesGuard` + `@RequireRoles('admin')` handles RBAC
- Roles are seeded at startup: `super_admin`, `admin`, `moderator`, `contributor`, `user`

### Response Contract

Successful REST responses are wrapped by `ResponseInterceptor`:
```json
{ "statusCode": 200, "data": { } }
```
`/ping`, `/docs`, `/docs-json`, `/docs/redoc`, `/mcp`, `/sse`, and `/messages` bypass the envelope.

### Validation

- Global `CustomValidationPipe` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`
- Swagger/ReDoc available at `/docs` when `ENABLE_SWAGGER=true` (basic auth when credentials are set)

### Key Environment Variables

- `PORT` - Application port
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `DB_SYNC` - TypeORM synchronize flag
- `JWT_SECRET`, `JWT_EXPIRATION_TIME` - JWT configuration
- `ENABLE_SWAGGER` - Toggle API docs
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - File storage

## Workflow Orchestration & Task Management

### 1) Plan-First Execution (Default for Non-Trivial Work)
- Enter plan mode for any non-trivial task (3+ steps, cross-module changes, or architectural decisions).
- Write a concrete plan in `tasks/todo.md` with checkable items before implementation.
- Include verification steps in the plan (tests, lint, behavior checks), not only implementation steps.
- Before writing code, verify the plan is still valid; if context changed, update `tasks/todo.md`.
- If execution goes sideways, stop and re-plan immediately.

### 2) Subagent Strategy (Keep Main Context Focused)
- Use subagents proactively for research, exploration, and parallel analysis.
- Use one task per subagent (single focused objective), then synthesize results in the main thread.
- Prefer parallel subagents for complex tasks to increase throughput and reduce context bloat.
- Keep implementation ownership in the main flow after subagent findings are consolidated.

### 3) Continuous Self-Improvement Loop
- After any user correction, update `tasks/lessons.md` in the same session.
- Record a generalized prevention rule (not a one-off fix) that can be reused.
- Each lesson must include: pattern, prevention rule, and a verification action.
- Review relevant lessons at session start before touching code in the same domain.

### 4) Verification Before Marking Done
- Never mark a task complete without evidence that it works.
- Run relevant tests and checks (`pnpm test`, targeted tests, `pnpm lint`, `pnpm build`).
- When behavior changes, compare old vs new behavior and validate expected deltas.
- Add a short review section to `tasks/todo.md` with what was validated and final status.

### 5) Demand Elegance (Balanced by Scope)
- For non-trivial changes, explicitly evaluate whether a simpler or more elegant design exists.
- If a solution feels hacky, rewrite to the clean solution using the latest understanding.
- Keep this proportional: avoid over-engineering trivial tasks.
- Optimize for minimal, robust, maintainable changes.

### 6) Autonomous Bug-Fixing Standard
- For bug reports, move directly to reproduce -> diagnose -> fix -> verify.
- Ground diagnosis in concrete signals (logs, stack traces, failing tests, CI output).
- Resolve root causes; avoid temporary patches unless explicitly requested.

### Task Tracking Protocol
- **Plan First**: Create/refresh `tasks/todo.md` with actionable checkbox items.
- **Track Progress**: Mark items complete as work advances.
- **Explain Changes**: Add brief high-level notes per completed step.
- **Document Results**: Add a review section with validation evidence.
- **Capture Lessons**: Update `tasks/lessons.md` after corrections.

### Core Delivery Principles
- **Simplicity First**: Solve the problem with the smallest correct change.
- **No Laziness**: Find and fix root causes; avoid fragile shortcuts.
- **Minimal Impact**: Touch only necessary code to reduce regression risk.

## Coding Standards

### Nomenclature
- **PascalCase** for classes
- **camelCase** for variables, functions, and methods
- **kebab-case** for file and directory names
- **UPPERCASE** for environment variables
- Start each function with a verb
- Use verbs for booleans: `isLoading`, `hasError`, `canDelete`

### Functions
- Short functions with a single purpose
- JSDoc mandatory in English
- Early returns over deep nesting
- Use RO-RO (Request Object - Return Object) when a function has many parameters
- Prefer immutability (`readonly`, `as const`)

### Classes
- SOLID principles
- Composition over inheritance
- Small classes with a single purpose

### Testing
- Follow Arrange-Act-Assert
- Group all tests for one function in a single `describe` block
- Use `beforeAll` for stable global mocks, `beforeEach` for test-specific reset
- Name test variables: `inputX`, `mockX`, `actualX`, `expectedX`
- Read external dependencies before mocking them
- Use `as unknown as Type` for complex entity mocks

### NestJS Specific Guidelines
- One module per main domain/route
- One controller per route group
- DTOs validated with `class-validator`
- Services own business logic and persistence orchestration
- Entities with TypeORM
- Global filters, middlewares, guards, and interceptors live in `src/common/`
- Add a small `admin/test` smoke method to each controller when useful
