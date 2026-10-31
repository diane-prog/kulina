import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    In,
    Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AbstractEntity } from './abstract.entity';

export abstract class AbstractRepository<T extends AbstractEntity<T>> {
    protected constructor(
        private readonly entityRepository: Repository<T>,
        protected readonly entityManager: EntityManager,
    ) {}

    /**
     * Counts the number of entities that match the provided conditions.
     *
     * @param options - TypeORM find options
     * @returns The number of matching entities
     */
    count(options: FindManyOptions<T>): Promise<number> {
        return this.entityRepository.count(options);
    }

    /**
     * Finds entities that match the provided conditions.
     *
     * @param options - TypeORM find options
     * @returns The matching entities
     */
    find(options: FindManyOptions<T>): Promise<T[]> {
        return this.entityRepository.find(options);
    }

    /**
     * Finds entities and returns them with the total count.
     *
     * @param options - TypeORM find options
     * @returns A tuple of entities and total count
     */
    findAndCount(options: FindManyOptions<T>): Promise<[T[], number]> {
        return this.entityRepository.findAndCount(options);
    }

    /**
     * Finds a single entity that matches the provided conditions.
     *
     * @param options - TypeORM find options
     * @returns The matching entity or null
     */
    async findOne(options: FindOneOptions<T>): Promise<T> {
        return await this.entityRepository.findOne(options);
    }

    /**
     * Creates and persists a new entity.
     *
     * @param entity - Entity to create
     * @returns The persisted entity
     */
    create(entity: T): Promise<T> {
        return this.entityManager.save(entity);
    }

    /**
     * Persists an entity.
     *
     * @param entity - Entity to save
     * @returns The persisted entity
     */
    save(entity: T): Promise<T> {
        return this.entityManager.save(entity);
    }

    /**
     * Persists multiple entities.
     *
     * @param entities - Entities to create
     * @returns The persisted entities
     */
    async createMany(entities: T[]): Promise<T[]> {
        return await this.entityManager.save(entities);
    }

    /**
     * Updates an entity matching the provided conditions.
     *
     * @param where - Conditions to match
     * @param partialEntity - Values to update
     * @returns The updated entity
     */
    async update(
        where: FindOptionsWhere<T>,
        partialEntity: QueryDeepPartialEntity<T>,
    ): Promise<any> {
        await this.entityRepository.update(where, partialEntity);
        return this.findOne({ where });
    }

    /**
     * Hard-deletes an entity matching the provided conditions.
     *
     * @param where - Conditions to match
     * @param message - Optional message returned to the caller
     * @returns The provided message or null
     */
    async delete(
        where: FindOptionsWhere<T>,
        message?: string | null,
    ): Promise<string> {
        await this.entityRepository.delete(where);
        return message ?? null;
    }

    /**
     * Hard-deletes multiple entities by identifier in a single query.
     *
     * @param ids - Entity identifiers to delete
     * @returns Number of deleted rows
     */
    async deleteMany(ids: string[]): Promise<number> {
        if (ids.length === 0) {
            return 0;
        }

        const result = await this.entityRepository.delete({
            id: In(ids),
        } as FindOptionsWhere<T>);

        return result.affected ?? 0;
    }

    /**
     * Soft-deletes an entity matching the provided conditions.
     *
     * @param where - Conditions to match
     * @param message - Optional message returned to the caller
     * @returns The provided message or null
     */
    async softDelete(
        where: FindOptionsWhere<T>,
        message?: string | null,
    ): Promise<string> {
        await this.entityRepository.softDelete(where);
        await this.entityRepository.update(where, {
            deleted: true,
        } as unknown as QueryDeepPartialEntity<T>);
        return message ?? null;
    }

    /**
     * Restores a soft-deleted entity matching the provided conditions.
     *
     * @param where - Conditions to match
     * @param message - Optional message returned to the caller
     * @returns The provided message or null
     */
    async restore(
        where: FindOptionsWhere<T>,
        message?: string | null,
    ): Promise<string> {
        await this.entityRepository.restore(where);
        await this.entityRepository.update(where, {
            deleted: false,
        } as unknown as QueryDeepPartialEntity<T>);
        return message ?? null;
    }

    /**
     * Retrieves one entity by criteria and optional relations.
     *
     * @param repository - Repository-like object used to query
     * @param criteria - Key/value criteria
     * @param relations - Optional relations to load
     * @returns The matching entity or null
     */
    async retrieveEntity(
        repository: any,
        criteria: { key: string; value: string },
        relations?: string[],
    ): Promise<any> {
        return await repository.findOne({
            where: { [criteria.key]: criteria.value.trim(), deleted: false },
            relations,
        });
    }

    /**
     * Retrieves multiple entities by criteria and optional relations.
     *
     * @param repository - Repository-like object used to query
     * @param criteria - Key/values criteria
     * @param relations - Optional relations to load
     * @returns The matching entities
     */
    async retrieveEntities(
        repository: any,
        criteria: { key: string; values: string[] },
        relations?: string[],
    ): Promise<any> {
        const filterValues = [...new Set(criteria.values)];

        return await repository.find({
            where: {
                [criteria.key]: In(filterValues),
                deleted: false,
            },
            relations,
        });
    }
}
