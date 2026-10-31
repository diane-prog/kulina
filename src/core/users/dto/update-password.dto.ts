import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Current password is required' })
    @IsString({ message: 'Current password must be a string' })
    currentPassword: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'New password is required' })
    @IsString({ message: 'New password must be a string' })
    @MinLength(8, { message: 'New password must be at least 8 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message:
            'New password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    newPassword: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Confirm password is required' })
    @IsString({ message: 'Confirm password must be a string' })
    confirmPassword: string;
}
