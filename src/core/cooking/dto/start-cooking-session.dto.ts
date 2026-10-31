import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class StartCookingSessionDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Recipe id is required' })
    @IsUUID('4', { message: 'Recipe id must be a valid UUID' })
    recipeId: string;
}
