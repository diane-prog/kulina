import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export class CreateReviewDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Recipe id is required' })
    @IsUUID('4', { message: 'Recipe id must be a valid UUID' })
    recipeId: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @Type(() => Number)
    @IsInt({ message: 'Rating must be an integer' })
    @Min(1, { message: 'Rating must be at least 1' })
    @Max(5, { message: 'Rating cannot exceed 5' })
    rating: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Comment must be a string' })
    comment?: string;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray({ message: 'Images must be an array' })
    @IsString({ each: true })
    images?: string[];
}
