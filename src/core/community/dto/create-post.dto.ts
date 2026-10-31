import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';
import { PostType } from '../../../common/enum/community.enum';

export class CreatePostDto {
    @ApiProperty({ example: 'How do you make a perfect jollof rice?' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

    @ApiProperty({ example: 'I am a beginner and I need tips.' })
    @IsNotEmpty({ message: 'Content is required' })
    @IsString({ message: 'Content must be a string' })
    content: string;

    @ApiProperty({ enum: PostType })
    @IsEnum(PostType, { message: 'Post type is not valid' })
    type: PostType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Recipe id must be a valid UUID' })
    recipeId?: string;
}
