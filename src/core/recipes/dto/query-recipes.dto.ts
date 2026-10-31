import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { Difficulty } from '../../../common/enum/recipe.enum';

export class QueryRecipesDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    query?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Cuisine id must be a valid UUID' })
    cuisineId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Category id must be a valid UUID' })
    categoryId?: string;

    @ApiProperty({ enum: Difficulty, required: false })
    @IsOptional()
    @IsEnum(Difficulty, { message: 'Difficulty is not valid' })
    difficulty?: Difficulty;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Maximum budget must be an integer' })
    @Min(0)
    maxBudgetFcfa?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Maximum time must be an integer' })
    @Min(0)
    maxTimeMinutes?: number;

    @ApiProperty({
        enum: ['recent', 'popular', 'rating', 'budget', 'time'],
        required: false,
        default: 'recent',
    })
    @IsOptional()
    @IsIn(['recent', 'popular', 'rating', 'budget', 'time'])
    sort?: 'recent' | 'popular' | 'rating' | 'budget' | 'time' = 'recent';

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 12 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(100)
    limit?: number = 12;
}
