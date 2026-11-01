import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class ConfirmUploadDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Public id is required' })
    @IsString({ message: 'Public id must be a string' })
    publicId: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'URL is required' })
    @IsString({ message: 'URL must be a string' })
    url: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Folder must be a string' })
    folder?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Format must be a string' })
    format?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'MIME type must be a string' })
    mimetype?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Width must be an integer' })
    @Min(0)
    width?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Height must be an integer' })
    @Min(0)
    height?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Bytes must be an integer' })
    @Min(0)
    bytes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Resource type must be a string' })
    resourceType?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Label must be a string' })
    label?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isTemporary must be a boolean' })
    isTemporary?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Owner id must be a string' })
    ownerId?: string;
}
