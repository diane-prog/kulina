import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class SearchByIngredientsDto {
    @ApiProperty({ type: [String], example: ['tomato', 'onion', 'rice'] })
    @IsArray({ message: 'Ingredients must be an array' })
    @ArrayMinSize(1, { message: 'At least one ingredient is required' })
    @IsString({ each: true })
    ingredients: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Maximum budget must be an integer' })
    @Min(0)
    maxBudgetFcfa?: number;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(50)
    limit?: number = 10;
}
