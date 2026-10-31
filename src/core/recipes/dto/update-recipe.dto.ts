import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Difficulty, RecipeStatus } from '../../../common/enum/recipe.enum';
import { RecipeIngredientDto } from './recipe-ingredient.dto';
import { RecipeStepDto } from './recipe-step.dto';
import { RecipeTipDto } from './recipe-tip.dto';

export class UpdateRecipeDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Video URL must be a string' })
    videoUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Preparation time must be an integer' })
    @Min(0)
    prepTimeMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Cooking time must be an integer' })
    @Min(0)
    cookTimeMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Servings must be an integer' })
    @Min(1)
    servings?: number;

    @ApiProperty({ enum: Difficulty, required: false })
    @IsOptional()
    @IsEnum(Difficulty, { message: 'Difficulty is not valid' })
    difficulty?: Difficulty;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Cuisine id must be a valid UUID' })
    cuisineId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Category id must be a valid UUID' })
    categoryId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Budget must be an integer' })
    @Min(0)
    budgetFcfa?: number;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray({ message: 'Tags must be an array' })
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({ type: [RecipeIngredientDto], required: false })
    @IsOptional()
    @IsArray({ message: 'Ingredients must be an array' })
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientDto)
    ingredients?: RecipeIngredientDto[];

    @ApiProperty({ type: [RecipeStepDto], required: false })
    @IsOptional()
    @IsArray({ message: 'Steps must be an array' })
    @ValidateNested({ each: true })
    @Type(() => RecipeStepDto)
    steps?: RecipeStepDto[];

    @ApiProperty({ type: [RecipeTipDto], required: false })
    @IsOptional()
    @IsArray({ message: 'Tips must be an array' })
    @ValidateNested({ each: true })
    @Type(() => RecipeTipDto)
    tips?: RecipeTipDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isFeatured must be a boolean' })
    isFeatured?: boolean;

    @ApiProperty({ enum: RecipeStatus, required: false })
    @IsOptional()
    @IsEnum(RecipeStatus, { message: 'Status is not valid' })
    status?: RecipeStatus;
}
