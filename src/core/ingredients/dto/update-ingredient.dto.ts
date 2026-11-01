import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class UpdateIngredientDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Category must be a string' })
    category?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Default unit must be a string' })
    defaultUnit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Estimated price must be an integer' })
    @Min(0)
    estimatedPriceXof?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ required: false, type: Object })
    @IsOptional()
    @IsObject({ message: 'Local names must be an object' })
    localNames?: Record<string, string>;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isCommon must be a boolean' })
    isCommon?: boolean;
}
