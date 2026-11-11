import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResendOtpDto {
    @ApiProperty({
        example: 'testeur@kulina.app',
        description: 'Email or phone number',
    })
    @IsNotEmpty({ message: 'Identity is required' })
    @IsString()
    identity: string;
}
