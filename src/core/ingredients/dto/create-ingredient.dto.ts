import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';

export class CreateIngredientDto {
    @ApiProperty({ example: 'Riz' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters' })
    name: string;

    @ApiProperty({ example: 'Céréales', required: false })
    @IsOptional()
    @IsString({ message: 'Category must be a string' })
    category?: string;

    @ApiProperty({ example: 'kg', required: false })
    @IsOptional()
    @IsString({ message: 'Default unit must be a string' })
    defaultUnit?: string;

    @ApiProperty({ example: 700, required: false })
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

    @ApiProperty({
        required: false,
        example: { fr: 'riz', fon: 'lan', mina: 'molu', ewe: 'molu' },
    })
    @IsOptional()
    @IsObject({ message: 'Local names must be an object' })
    localNames?: Record<string, string>;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isCommon must be a boolean' })
    isCommon?: boolean;
}
