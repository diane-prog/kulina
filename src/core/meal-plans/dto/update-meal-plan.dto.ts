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
import { MealPlanStatus } from '../../../common/enum/meal-plan.enum';

export class UpdateMealPlanDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString({}, { message: 'Week start date must be a valid date' })
    weekStartDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Budget must be an integer' })
    @Min(0)
    budgetFcfa?: number;

    @ApiProperty({ enum: MealPlanStatus, required: false })
    @IsOptional()
    @IsEnum(MealPlanStatus, { message: 'Status is not valid' })
    status?: MealPlanStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    notes?: string;
}
