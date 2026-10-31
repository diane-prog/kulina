import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateRecipeCategoryDto {
    @ApiProperty({ example: 'Main dishes' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters' })
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ example: '🍲', required: false })
    @IsOptional()
    @IsString({ message: 'Icon must be a string' })
    icon?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isActive must be a boolean' })
    isActive?: boolean;
}
