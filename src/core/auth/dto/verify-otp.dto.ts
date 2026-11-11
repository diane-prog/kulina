import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
    @ApiProperty({
        example: 'testeur@kulina.app',
        description: 'Email or phone number used during login or registration',
    })
    @IsNotEmpty({ message: 'Identity is required' })
    @IsString()
    identity: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit OTP code sent by email',
    })
    @IsNotEmpty({ message: 'Code is required' })
    @IsString()
    @Length(6, 6, { message: 'Code must be exactly 6 digits' })
    code: string;
}
