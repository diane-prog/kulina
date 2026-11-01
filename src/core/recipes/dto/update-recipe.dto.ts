import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Country } from '../../../common/enum/country.enum';
import { Difficulty, RecipeStatus } from '../../../common/enum/recipe.enum';
import { RecipeIngredientDto } from './recipe-ingredient.dto';
import { RecipeIssueDto } from './recipe-issue.dto';
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
    @IsString({ message: 'Cover image URL must be a string' })
    coverImageUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Preparation time must be an integer' })
    @Min(0)
    prepMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Cooking time must be an integer' })
    @Min(0)
    cookMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Base servings must be an integer' })
    @Min(1)
    baseServings?: number;

    @ApiProperty({ enum: Difficulty, required: false })
    @IsOptional()
    @IsEnum(Difficulty, { message: 'Difficulty is not valid' })
    difficulty?: Difficulty;

    @ApiProperty({ enum: Country, required: false })
    @IsOptional()
    @IsEnum(Country, { message: 'Country is not valid' })
    country?: Country;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Category must be a string' })
    category?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Budget must be an integer' })
    @Min(0)
    estimatedBudgetXof?: number;

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

    @ApiProperty({ type: [RecipeIssueDto], required: false })
    @IsOptional()
    @IsArray({ message: 'Issues must be an array' })
    @ValidateNested({ each: true })
    @Type(() => RecipeIssueDto)
    issues?: RecipeIssueDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isFeatured must be a boolean' })
    isFeatured?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isPremium must be a boolean' })
    isPremium?: boolean;

    @ApiProperty({ enum: RecipeStatus, required: false })
    @IsOptional()
    @IsEnum(RecipeStatus, { message: 'Status is not valid' })
    status?: RecipeStatus;
}
