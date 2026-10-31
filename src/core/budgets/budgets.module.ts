import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { Budget } from './entities/budget.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './repositories/budgets.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Budget])],
    controllers: [BudgetsController],
    providers: [BudgetsService, BudgetsRepository],
    exports: [BudgetsService, BudgetsRepository],
})
export class BudgetsModule {}
