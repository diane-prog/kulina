import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';

export class CreateMealPlanDto {
    @ApiProperty({ example: 'My week of African meals' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

    @ApiProperty({ example: '2026-11-02' })
    @IsNotEmpty({ message: 'Week start date is required' })
    @IsDateString({}, { message: 'Week start date must be a valid date' })
    weekStartDate: string;

    @ApiProperty({ example: 25000, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Budget must be an integer' })
    @Min(0)
    budgetFcfa?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    notes?: string;
}
