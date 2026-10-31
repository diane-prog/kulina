import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
} from 'class-validator';
import { SkillLevel } from '../../../common/enum/user.enum';

export class UpdateProfileDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Fullname must be a string' })
    @MinLength(2, { message: 'Fullname must be at least 2 characters' })
    fullname?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Bio must be a string' })
    bio?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Country must be a string' })
    country?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'City must be a string' })
    city?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Preferred cuisine must be a string' })
    preferredCuisine?: string;

    @ApiProperty({ enum: SkillLevel, required: false })
    @IsOptional()
    @IsEnum(SkillLevel, { message: 'Skill level is not valid' })
    skillLevel?: SkillLevel;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Monthly budget must be an integer' })
    @Min(0, { message: 'Monthly budget cannot be negative' })
    monthlyBudgetFcfa?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray({ message: 'Dietary preferences must be an array' })
    @IsString({ each: true })
    dietaryPreferences?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray({ message: 'Allergies must be an array' })
    @IsString({ each: true })
    allergies?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Avatar id must be a valid UUID' })
    avatarId?: string;
}
