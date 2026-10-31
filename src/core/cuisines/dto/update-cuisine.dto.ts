import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCuisineDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    name?: string;

    @ApiProperty({ required: false })
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
