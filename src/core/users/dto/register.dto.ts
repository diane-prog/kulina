import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Min,
    MinLength,
} from 'class-validator';
import { SkillLevel } from '../../../common/enum/user.enum';

export class RegisterUserDto {
    @ApiProperty({ example: 'Awa Koné' })
    @IsNotEmpty({ message: 'Fullname is required' })
    @IsString({ message: 'Fullname must be a string' })
    @MinLength(2, { message: 'Fullname must be at least 2 characters' })
    fullname: string;

    @ApiProperty({ example: 'awa@example.com', required: false })
    @IsOptional()
    @IsEmail({}, { message: 'The email format is not valid' })
    email?: string;

    @ApiProperty({ example: '+22997000000', required: false })
    @IsOptional()
    @Matches(/^\+?[0-9\s-]{8,20}$/, { message: 'Phone number is not valid' })
    phone?: string;

    @ApiProperty({ example: 'Kulina2026!' })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    password: string;

    @ApiProperty({ example: 'Kulina2026!' })
    @IsNotEmpty({ message: 'Confirm password is required' })
    @IsString({ message: 'Confirm password must be a string' })
    confirmPassword: string;

    @ApiProperty({ enum: SkillLevel, required: false })
    @IsOptional()
    @IsEnum(SkillLevel, { message: 'Skill level is not valid' })
    skillLevel?: SkillLevel;

    @ApiProperty({ example: 'BJ', required: false })
    @IsOptional()
    @IsString({ message: 'Country must be a string' })
    country?: string;

    @ApiProperty({ example: 'Cotonou', required: false })
    @IsOptional()
    @IsString({ message: 'City must be a string' })
    city?: string;

    @ApiProperty({ example: 'fr', required: false })
    @IsOptional()
    @IsString({ message: 'Locale must be a string' })
    locale?: string;

    @ApiProperty({ example: ['Bouillies'], required: false })
    @IsOptional()
    @IsArray({ message: 'Preferred categories must be an array' })
    @IsString({ each: true })
    preferredCategories?: string[];

    @ApiProperty({ example: 50000, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Monthly budget must be an integer' })
    @Min(0, { message: 'Monthly budget cannot be negative' })
    monthlyBudgetXof?: number;

    @ApiProperty({ example: ['vegetarian'], required: false })
    @IsOptional()
    @IsArray({ message: 'Dietary preferences must be an array' })
    @IsString({ each: true })
    dietaryPreferences?: string[];

    @ApiProperty({ example: ['peanut'], required: false })
    @IsOptional()
    @IsArray({ message: 'Allergies must be an array' })
    @IsString({ each: true })
    allergies?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Avatar id must be a valid UUID' })
    avatarId?: string;
}
