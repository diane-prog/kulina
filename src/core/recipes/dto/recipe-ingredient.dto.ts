import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class RecipeIngredientDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Ingredient id is required' })
    @IsUUID('4', { message: 'Ingredient id must be a valid UUID' })
    ingredientId: string;

    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(0, { message: 'Quantity cannot be negative' })
    quantity: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Unit must be a string' })
    unit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Note must be a string' })
    note?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'optional must be a boolean' })
    optional?: boolean;

    @ApiProperty({ required: false, type: Object })
    @IsOptional()
    @IsObject({ message: 'Substitutes must be an object' })
    substitutes?: Record<string, string>;
}
