# Lessons

This file captures generalized prevention rules after corrections.

## Format

Each lesson must include:

- **Pattern**: what went wrong
- **Prevention rule**: the generic rule to apply next time
- **Verification**: how to prove the rule is respected

## Lessons

### 1. Keep provider credentials out of tracked files

- **Pattern**: Cloudinary credentials were shared in chat and could easily be copied into a tracked source or documentation file.
- **Prevention rule**: store real credentials only in `.env` (gitignored) or runtime environment variables. Commit placeholders in `.env.example`, never real values.
- **Verification**: `git status` must not show `.env`, and a repository search must not find the real key/secret values.

### 2. Give Jest enough heap when testing heavy SDK modules

- **Pattern**: importing the Gemini SDK through `AiService` caused Jest workers to run out of memory on Windows.
- **Prevention rule**: run Jest with a larger heap (`node --max-old-space-size=4096 node_modules/jest/bin/jest.js`) when the test graph includes large SDKs, and keep the script in `package.json`.
- **Verification**: `pnpm run test` must complete without worker OOM crashes.

### 3. Keep seed slugs idempotent and accent-safe

- **Pattern**: `toSlug` dropped the `œ` ligature, so `Œufs brouillés` was stored as `ufs-brouilles` while the seed declared `oeufs-brouilles`. The existence check missed it and the recipe would be re-created on every startup.
- **Prevention rule**: normalize ligatures (`œ` → `oe`, `æ` → `ae`) in slug generation, and make every seeder check existence against the exact slug the create path will produce.
- **Verification**: a unit test asserts that `toSlug(recipe.title)` equals every catalog seed slug, and a second app boot against the same database must leave the recipe count unchanged.
