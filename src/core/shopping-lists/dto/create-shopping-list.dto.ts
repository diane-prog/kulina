import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateShoppingListDto {
    @ApiProperty({ example: 'Weekly market list' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Meal plan id must be a valid UUID' })
    mealPlanId?: string;
}
