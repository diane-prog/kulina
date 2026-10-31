import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { SkillLevel } from '../../../common/enum/user.enum';

export class UpdateTutorialDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Thumbnail URL must be a string' })
    thumbnailUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Video URL must be a string' })
    videoUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Duration must be an integer' })
    @Min(0)
    durationMinutes?: number;

    @ApiProperty({ enum: SkillLevel, required: false })
    @IsOptional()
    @IsEnum(SkillLevel, { message: 'Level is not valid' })
    level?: SkillLevel;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Cuisine id must be a valid UUID' })
    cuisineId?: string;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray({ message: 'Tags must be an array' })
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isPublished must be a boolean' })
    isPublished?: boolean;
}
