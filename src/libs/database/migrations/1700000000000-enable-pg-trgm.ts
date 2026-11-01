import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePgTrgm1700000000000 implements MigrationInterface {
    name = 'EnablePgTrgm1700000000000';

    /**
     * Enables fuzzy search indexes on recipe and ingredient names.
     *
     * @param queryRunner - TypeORM query runner
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        await queryRunner.query(`
            DO $$
            BEGIN
                IF to_regclass('public.recipes') IS NOT NULL THEN
                    CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm
                    ON recipes USING gin (title gin_trgm_ops);
                END IF;
                IF to_regclass('public.ingredients') IS NOT NULL THEN
                    CREATE INDEX IF NOT EXISTS idx_ingredients_name_trgm
                    ON ingredients USING gin (name gin_trgm_ops);
                END IF;
            END $$;
        `);
    }

    /**
     * Removes fuzzy search indexes.
     *
     * @param queryRunner - TypeORM query runner
     */
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX IF EXISTS idx_ingredients_name_trgm',
        );
        await queryRunner.query('DROP INDEX IF EXISTS idx_recipes_title_trgm');
    }
}
