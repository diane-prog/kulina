import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PhotoCheckDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Public id is required' })
    @IsString({ message: 'Public id must be a string' })
    publicId: string;
}
