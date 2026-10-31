import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { SkillLevel } from '../../../common/enum/user.enum';

export class QueryTutorialsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    query?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Cuisine id must be a valid UUID' })
    cuisineId?: string;

    @ApiProperty({ enum: SkillLevel, required: false })
    @IsOptional()
    @IsEnum(SkillLevel, { message: 'Level is not valid' })
    level?: SkillLevel;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 12 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(100)
    limit?: number = 12;
}
