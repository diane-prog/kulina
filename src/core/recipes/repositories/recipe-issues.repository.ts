import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { RecipeIssue } from '../entities/recipe-issue.entity';

@Injectable()
export class RecipeIssuesRepository extends AbstractRepository<RecipeIssue> {
    protected readonly logger = new Logger(RecipeIssuesRepository.name);

    constructor(
        @InjectRepository(RecipeIssue)
        recipeIssuesRepository: Repository<RecipeIssue>,
        entityManager: EntityManager,
    ) {
        super(recipeIssuesRepository, entityManager);
    }

    /**
     * Finds issues whose symptom or cause matches the user message words.
     *
     * @param recipeId - Recipe identifier
     * @param text - User message
     * @returns Candidate issues
     */
    async findCandidates(
        recipeId: string,
        text: string,
    ): Promise<RecipeIssue[]> {
        const words = text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 2);

        if (words.length === 0) {
            return [];
        }

        const query = this.entityRepository
            .createQueryBuilder('issue')
            .where('issue.deleted = false')
            .andWhere('issue.recipeId = :recipeId', { recipeId });

        const conditions = words
            .map(
                (_word, index) =>
                    `issue.symptom ILIKE :word${index} OR issue.cause ILIKE :word${index}`,
            )
            .join(' OR ');

        query.andWhere(`(${conditions})`);
        words.forEach((word, index) => {
            query.setParameter(`word${index}`, `%${word}%`);
        });

        return await query.getMany();
    }
}
