import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    Min,
} from 'class-validator';

export class GenerateMealPlanDto {
    @ApiProperty({ example: '2026-11-02' })
    @IsNotEmpty({ message: 'Week start date is required' })
    @IsDateString({}, { message: 'Week start date must be a valid date' })
    weekStartDate: string;

    @ApiProperty({ example: 25000 })
    @Type(() => Number)
    @IsInt({ message: 'Budget must be an integer' })
    @Min(0)
    budgetFcfa: number;

    @ApiProperty({ example: 4, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Servings must be an integer' })
    @Min(1)
    servings?: number;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean({ message: 'includeLunch must be a boolean' })
    includeLunch?: boolean;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean({ message: 'includeDinner must be a boolean' })
    includeDinner?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Cuisine id must be a valid UUID' })
    cuisineId?: string;
}
