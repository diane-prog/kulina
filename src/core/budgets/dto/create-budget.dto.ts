import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';
import { BudgetPeriod } from '../../../common/enum/budget.enum';

export class CreateBudgetDto {
    @ApiProperty({ example: 'Weekly food budget' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

    @ApiProperty({ enum: BudgetPeriod })
    @IsEnum(BudgetPeriod, { message: 'Period is not valid' })
    period: BudgetPeriod;

    @ApiProperty({ example: 20000 })
    @Type(() => Number)
    @IsInt({ message: 'Amount must be an integer' })
    @Min(0)
    amountFcfa: number;

    @ApiProperty({ example: '2026-11-02' })
    @IsNotEmpty({ message: 'Start date is required' })
    @IsDateString({}, { message: 'Start date must be a valid date' })
    startDate: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString({}, { message: 'End date must be a valid date' })
    endDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    notes?: string;
}
