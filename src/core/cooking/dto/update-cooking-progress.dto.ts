import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CookingSessionStatus } from '../../../common/enum/cooking.enum';

export class UpdateCookingProgressDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Current step must be an integer' })
    @Min(1)
    currentStepNumber?: number;

    @ApiProperty({ enum: CookingSessionStatus, required: false })
    @IsOptional()
    @IsEnum(CookingSessionStatus, { message: 'Status is not valid' })
    status?: CookingSessionStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    notes?: string;
}
