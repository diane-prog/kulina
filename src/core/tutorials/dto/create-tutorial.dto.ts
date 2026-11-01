import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';
import { Country } from '../../../common/enum/country.enum';
import { SkillLevel } from '../../../common/enum/user.enum';

export class CreateTutorialDto {
    @ApiProperty({ example: 'How to cut onions without crying' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Thumbnail URL must be a string' })
    thumbnailUrl?: string;

    @ApiProperty({ example: 'https://www.youtube.com/watch?v=example' })
    @IsNotEmpty({ message: 'Video URL is required' })
    @IsString({ message: 'Video URL must be a string' })
    videoUrl: string;

    @ApiProperty({ example: 8, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Duration must be an integer' })
    @Min(0)
    durationMinutes?: number;

    @ApiProperty({ enum: SkillLevel, required: false })
    @IsOptional()
    @IsEnum(SkillLevel, { message: 'Level is not valid' })
    level?: SkillLevel;

    @ApiProperty({ enum: Country, required: false })
    @IsOptional()
    @IsEnum(Country, { message: 'Country is not valid' })
    country?: Country;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Category must be a string' })
    category?: string;

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
