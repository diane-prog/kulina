import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import {
    CLOUDINARY_SCOPES,
    type CloudinaryScope,
} from '../cloudinary.constants';

export class UploadFileDto {
    @ApiProperty({
        enum: CLOUDINARY_SCOPES,
        required: false,
        default: 'general',
    })
    @IsOptional()
    @IsIn([...CLOUDINARY_SCOPES], { message: 'Scope is not valid' })
    scope?: CloudinaryScope;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Label must be a string' })
    label?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean({ message: 'isTemporary must be a boolean' })
    isTemporary?: boolean;
}
