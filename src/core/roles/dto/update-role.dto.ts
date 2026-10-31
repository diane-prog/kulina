import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
    @ApiProperty({
        example: 'Moderates community content.',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;
}
