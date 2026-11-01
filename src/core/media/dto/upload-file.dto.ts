import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { MEDIA_SCOPES, type MediaScope } from '../media.constants';

export class UploadFileDto {
    @ApiProperty({
        enum: MEDIA_SCOPES,
        required: false,
        default: 'general',
    })
    @IsOptional()
    @IsIn([...MEDIA_SCOPES], { message: 'Scope is not valid' })
    scope?: MediaScope;

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
