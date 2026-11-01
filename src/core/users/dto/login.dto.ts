import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
    @ApiProperty({ example: 'awa@example.com or +22997000000' })
    @IsNotEmpty({ message: 'Email or phone is required' })
    @IsString({ message: 'Email or phone must be a string' })
    identity: string;

    @ApiProperty({ example: 'Kulina2026!' })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;
}
