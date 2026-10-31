import { ForbiddenException, Injectable } from '@nestjs/common';
import { BudgetPeriod, BudgetStatus } from '../../common/enum/budget.enum';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { paginate } from '../../utils/pagination';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { QueryBudgetsDto } from './dto/query-budgets.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Budget } from './entities/budget.entity';
import { BudgetsRepository } from './repositories/budgets.repository';

@Injectable()
export class BudgetsService {
    constructor(
        private readonly budgetsRepository: BudgetsRepository,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {}

    /**
     * Creates a food budget in FCFA.
     *
     * @param userId - Owner identifier
     * @param dto - Budget payload
     * @returns The created budget
     */
    async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
        const startDate = this.normalizeDate(dto.startDate);

        return await this.budgetsRepository.create(
            new Budget({
                user: { id: userId } as any,
                title: dto.title,
                period: dto.period,
                amountFcfa: dto.amountFcfa,
                spentFcfa: 0,
                startDate,
                endDate: dto.endDate
                    ? this.normalizeDate(dto.endDate)
                    : this.computeEndDate(startDate, dto.period),
                status: BudgetStatus.ACTIVE,
                notes: dto.notes,
            }),
        );
    }

    /**
     * Lists the user's budgets.
     *
     * @param userId - Owner identifier
     * @param query - Filters and pagination
     * @returns A paginated budget list
     */
    async findAll(userId: string, query: QueryBudgetsDto) {
        const budgets = await this.budgetsRepository.find({
            where: { user: { id: userId }, deleted: false },
            order: { createdAt: 'DESC' },
        });

        const filtered = budgets.filter((budget) =>
            query.status ? budget.status === query.status : true,
        );
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const data = filtered
            .slice((page - 1) * limit, page * limit)
            .map((budget) => this.mapBudget(budget));

        return paginate(data, filtered.length, page, limit);
    }

    /**
     * Retrieves one budget owned by the user.
     *
     * @param id - Budget identifier
     * @param userId - Owner identifier
     * @returns The budget
     */
    async findOne(id: string, userId: string): Promise<Budget> {
        return await this.retrieveBudget(id, userId);
    }

    /**
     * Updates a budget.
     *
     * @param id - Budget identifier
     * @param userId - Owner identifier
     * @param dto - Updated payload
     * @returns The updated budget
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateBudgetDto,
    ): Promise<Budget> {
        const budget = await this.retrieveBudget(id, userId);

        return await this.budgetsRepository.update(
            { id },
            {
                title: dto.title ?? budget.title,
                amountFcfa: dto.amountFcfa ?? budget.amountFcfa,
                spentFcfa: dto.spentFcfa ?? budget.spentFcfa,
                endDate: dto.endDate
                    ? this.normalizeDate(dto.endDate)
                    : budget.endDate,
                status: dto.status ?? budget.status,
                notes: dto.notes ?? budget.notes,
            },
        );
    }

    /**
     * Soft-deletes a budget.
     *
     * @param id - Budget identifier
     * @param userId - Owner identifier
     * @returns A confirmation message
     */
    async remove(id: string, userId: string): Promise<{ message: string }> {
        await this.retrieveBudget(id, userId);
        await this.budgetsRepository.softDelete({ id });

        return { message: 'Budget deleted successfully' };
    }

    /**
     * Builds an overall budget summary for the user.
     *
     * @param userId - Owner identifier
     * @returns Budget totals and remaining amounts
     */
    async getSummary(userId: string) {
        const budgets = await this.budgetsRepository.find({
            where: { user: { id: userId }, deleted: false },
        });
        const active = budgets.filter(
            (budget) => budget.status === BudgetStatus.ACTIVE,
        );
        const totalAmountFcfa = active.reduce(
            (total, budget) => total + budget.amountFcfa,
            0,
        );
        const totalSpentFcfa = active.reduce(
            (total, budget) => total + budget.spentFcfa,
            0,
        );

        return {
            activeBudgetCount: active.length,
            totalAmountFcfa,
            totalSpentFcfa,
            remainingFcfa: totalAmountFcfa - totalSpentFcfa,
            isWithinBudget: totalSpentFcfa <= totalAmountFcfa,
            weekly: active
                .filter((budget) => budget.period === BudgetPeriod.WEEKLY)
                .map((budget) => this.mapBudget(budget)),
            monthly: active
                .filter((budget) => budget.period === BudgetPeriod.MONTHLY)
                .map((budget) => this.mapBudget(budget)),
        };
    }

    /**
     * Loads a budget owned by the user.
     *
     * @param id - Budget identifier
     * @param userId - Owner identifier
     * @returns The budget entity
     */
    private async retrieveBudget(id: string, userId: string): Promise<Budget> {
        const budget = await this.budgetsRepository.findOne({
            where: { id, deleted: false },
        });

        if (!budget) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Budget ${id} not found`,
                'Budget not found',
            );
        }

        if (budget.user?.id !== userId) {
            throw new ForbiddenException(
                'You can only access your own budgets',
            );
        }

        return budget;
    }

    /**
     * Formats a date as YYYY-MM-DD.
     *
     * @param value - Date input
     * @returns The normalized date
     */
    private normalizeDate(value: string): string {
        return new Date(value).toISOString().slice(0, 10);
    }

    /**
     * Computes the end date of a budget period.
     *
     * @param startDate - Start date
     * @param period - Budget period
     * @returns The computed end date
     */
    private computeEndDate(startDate: string, period: BudgetPeriod): string {
        const date = new Date(startDate);

        if (period === BudgetPeriod.WEEKLY) {
            date.setDate(date.getDate() + 6);
        } else {
            date.setMonth(date.getMonth() + 1);
            date.setDate(date.getDate() - 1);
        }

        return date.toISOString().slice(0, 10);
    }

    /**
     * Maps a budget to a public representation.
     *
     * @param budget - Budget entity
     * @returns The budget payload
     */
    private mapBudget(budget: Budget) {
        return {
            id: budget.id,
            title: budget.title,
            period: budget.period,
            amountFcfa: budget.amountFcfa,
            spentFcfa: budget.spentFcfa,
            remainingFcfa: budget.amountFcfa - budget.spentFcfa,
            isWithinBudget: budget.spentFcfa <= budget.amountFcfa,
            startDate: budget.startDate,
            endDate: budget.endDate,
            status: budget.status,
            notes: budget.notes,
            createdAt: budget.createdAt,
        };
    }
}
