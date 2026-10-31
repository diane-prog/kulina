import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { SkillLevel } from '../../../common/enum/user.enum';

export class SuggestRecipesDto {
    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray({ message: 'Ingredients must be an array' })
    @IsString({ each: true })
    ingredients?: string[];

    @ApiProperty({ example: 5000, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Budget must be an integer' })
    @Min(0)
    budgetFcfa?: number;

    @ApiProperty({ enum: SkillLevel, required: false })
    @IsOptional()
    @IsEnum(SkillLevel, { message: 'Skill level is not valid' })
    skillLevel?: SkillLevel;

    @ApiProperty({ example: 4, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Servings must be an integer' })
    @Min(1)
    servings?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Cuisine id must be a valid UUID' })
    cuisineId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Maximum time must be an integer' })
    @Min(0)
    maxTimeMinutes?: number;

    @ApiProperty({ required: false, default: 5 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(20)
    limit?: number = 5;
}
