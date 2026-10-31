import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    Min,
} from 'class-validator';
import { MealType } from '../../../common/enum/recipe.enum';

export class AddMealPlanItemDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Recipe id is required' })
    @IsUUID('4', { message: 'Recipe id must be a valid UUID' })
    recipeId: string;

    @ApiProperty({ example: '2026-11-03' })
    @IsNotEmpty({ message: 'Planned date is required' })
    @IsDateString({}, { message: 'Planned date must be a valid date' })
    plannedDate: string;

    @ApiProperty({ enum: MealType })
    @IsEnum(MealType, { message: 'Meal type is not valid' })
    mealType: MealType;

    @ApiProperty({ example: 4, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Servings must be an integer' })
    @Min(1)
    servings?: number;
}
