import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BudgetStatus } from '../../../common/enum/budget.enum';

export class QueryBudgetsDto {
    @ApiProperty({ enum: BudgetStatus, required: false })
    @IsOptional()
    @IsEnum(BudgetStatus, { message: 'Status is not valid' })
    status?: BudgetStatus;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
