import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Difficulty, RecipeStatus } from '../../../common/enum/recipe.enum';
import { RecipeIngredientDto } from './recipe-ingredient.dto';
import { RecipeStepDto } from './recipe-step.dto';
import { RecipeTipDto } from './recipe-tip.dto';

export class CreateRecipeDto {
    @ApiProperty({ example: 'Poulet braisé' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

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

    @ApiProperty({ example: 15, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Preparation time must be an integer' })
    @Min(0)
    prepTimeMinutes?: number;

    @ApiProperty({ example: 30, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Cooking time must be an integer' })
    @Min(0)
    cookTimeMinutes?: number;

    @ApiProperty({ example: 4, required: false })
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

    @ApiProperty({ example: 5000, required: false })
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

    @ApiProperty({ type: [RecipeIngredientDto] })
    @IsArray({ message: 'Ingredients must be an array' })
    @ArrayMinSize(1, { message: 'At least one ingredient is required' })
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientDto)
    ingredients: RecipeIngredientDto[];

    @ApiProperty({ type: [RecipeStepDto] })
    @IsArray({ message: 'Steps must be an array' })
    @ArrayMinSize(1, { message: 'At least one step is required' })
    @ValidateNested({ each: true })
    @Type(() => RecipeStepDto)
    steps: RecipeStepDto[];

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
