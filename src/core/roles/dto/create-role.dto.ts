import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoleDto {
    @ApiProperty({ example: 'contributor' })
    @IsNotEmpty({ message: 'Label is required' })
    @IsString({ message: 'Label must be a string' })
    @MinLength(2, { message: 'Label must be at least 2 characters' })
    label: string;

    @ApiProperty({
        example: 'Creates and manages recipes and tutorials.',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;
}
