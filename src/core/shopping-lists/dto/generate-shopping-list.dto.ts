import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateShoppingListDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Meal plan id is required' })
    @IsUUID('4', { message: 'Meal plan id must be a valid UUID' })
    mealPlanId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;
}
