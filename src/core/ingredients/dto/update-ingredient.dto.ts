import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
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
    @IsString({ message: 'Unit must be a string' })
    unit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Average price must be an integer' })
    @Min(0, { message: 'Average price cannot be negative' })
    averagePriceFcfa?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray({ message: 'Aliases must be an array' })
    @IsString({ each: true })
    aliases?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isCommon must be a boolean' })
    isCommon?: boolean;
}
