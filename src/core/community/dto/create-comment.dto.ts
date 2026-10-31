import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({ example: 'Add a little more pepper and let it simmer.' })
    @IsNotEmpty({ message: 'Content is required' })
    @IsString({ message: 'Content must be a string' })
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Parent id must be a valid UUID' })
    parentId?: string;
}
