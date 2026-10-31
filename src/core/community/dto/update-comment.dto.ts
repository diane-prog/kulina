import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Content is required' })
    @IsString({ message: 'Content must be a string' })
    content: string;
}
