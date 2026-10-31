import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { BudgetStatus } from '../../../common/enum/budget.enum';

export class UpdateBudgetDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Amount must be an integer' })
    @Min(0)
    amountFcfa?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Spent amount must be an integer' })
    @Min(0)
    spentFcfa?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString({}, { message: 'End date must be a valid date' })
    endDate?: string;

    @ApiProperty({ enum: BudgetStatus, required: false })
    @IsOptional()
    @IsEnum(BudgetStatus, { message: 'Status is not valid' })
    status?: BudgetStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    notes?: string;
}
