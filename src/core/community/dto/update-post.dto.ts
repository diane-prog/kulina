import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentStatus, PostType } from '../../../common/enum/community.enum';

export class UpdatePostDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Content must be a string' })
    content?: string;

    @ApiProperty({ enum: PostType, required: false })
    @IsOptional()
    @IsEnum(PostType, { message: 'Post type is not valid' })
    type?: PostType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ enum: ContentStatus, required: false })
    @IsOptional()
    @IsEnum(ContentStatus, { message: 'Status is not valid' })
    status?: ContentStatus;
}
