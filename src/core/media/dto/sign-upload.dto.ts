import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MEDIA_SCOPES, type MediaScope } from '../media.constants';

export class SignUploadDto {
    @ApiProperty({ enum: MEDIA_SCOPES, default: 'general' })
    @IsIn([...MEDIA_SCOPES], { message: 'Scope is not valid' })
    scope: MediaScope;

    @ApiProperty({ required: false, example: 'bouillie-de-riz' })
    @IsOptional()
    @IsString({ message: 'Slug must be a string' })
    slug?: string;

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Step must be an integer' })
    @Min(1)
    step?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Owner id must be a string' })
    ownerId?: string;
}
