import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateCuisineDto {
    @ApiProperty({ example: 'Ivorian' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters' })
    name: string;

    @ApiProperty({ example: 'West Africa', required: false })
    @IsOptional()
    @IsString({ message: 'Region must be a string' })
    region?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isActive must be a boolean' })
    isActive?: boolean;
}
