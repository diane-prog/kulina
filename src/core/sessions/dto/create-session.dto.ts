import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateSessionDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Recipe id is required' })
    @IsUUID('4', { message: 'Recipe id must be a valid UUID' })
    recipeId: string;

    @ApiProperty({ example: 2, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Servings must be an integer' })
    @Min(1)
    servings?: number;
}
