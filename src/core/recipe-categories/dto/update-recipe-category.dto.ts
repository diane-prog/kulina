import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateRecipeCategoryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Icon must be a string' })
    icon?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isActive must be a boolean' })
    isActive?: boolean;
}
