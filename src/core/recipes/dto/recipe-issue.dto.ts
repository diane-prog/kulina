import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { IssueSeverity } from '../../../common/enum/issue.enum';

export class RecipeIssueDto {
    @ApiProperty({ example: 2, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Step position must be an integer' })
    @Min(1)
    stepPosition?: number;

    @ApiProperty({ example: 'Le riz a trop gonflé' })
    @IsNotEmpty({ message: 'Symptom is required' })
    @IsString({ message: 'Symptom must be a string' })
    symptom: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Cause must be a string' })
    cause?: string;

    @ApiProperty({ example: 'Égoutte et réduis la cuisson.' })
    @IsNotEmpty({ message: 'Fix is required' })
    @IsString({ message: 'Fix must be a string' })
    fix: string;

    @ApiProperty({ enum: IssueSeverity, required: false })
    @IsOptional()
    @IsEnum(IssueSeverity, { message: 'Severity is not valid' })
    severity?: IssueSeverity;
}
