import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ImportRecipesDto {
    @ApiProperty({ type: [String] })
    @IsArray({ message: 'Recipes must be an array' })
    @ArrayMinSize(1, { message: 'At least one recipe is required' })
    @IsString({ each: true })
    recipes: string[];
}
