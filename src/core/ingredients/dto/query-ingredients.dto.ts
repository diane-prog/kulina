import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryIngredientsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    query?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Category must be a string' })
    category?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
