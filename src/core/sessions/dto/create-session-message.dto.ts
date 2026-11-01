import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSessionMessageDto {
    @ApiProperty({ example: 'Mon riz est trop épais, que faire ?' })
    @IsNotEmpty({ message: 'Message is required' })
    @IsString({ message: 'Message must be a string' })
    @MaxLength(300, { message: 'Message cannot exceed 300 characters' })
    content: string;
}
