import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class AddShoppingListItemDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Ingredient id is required' })
    @IsUUID('4', { message: 'Ingredient id must be a valid UUID' })
    ingredientId: string;

    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(0)
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
    @IsBoolean({ message: 'isChecked must be a boolean' })
    isChecked?: boolean;
}
