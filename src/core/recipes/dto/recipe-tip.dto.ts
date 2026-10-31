import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RecipeTipDto {
    @ApiProperty({ example: 'Taste before serving and adjust the salt.' })
    @IsNotEmpty({ message: 'Tip content is required' })
    @IsString({ message: 'Tip content must be a string' })
    content: string;
}
