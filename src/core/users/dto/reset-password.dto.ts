import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Reset token is required' })
    @IsString({ message: 'Reset token must be a string' })
    token: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    password: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Confirm password is required' })
    @IsString({ message: 'Confirm password must be a string' })
    confirmPassword: string;
}
