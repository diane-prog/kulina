import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class SearchQueryDto {
    @ApiProperty({ example: 'jollof' })
    @IsNotEmpty({ message: 'Search query is required' })
    @IsString({ message: 'Search query must be a string' })
    q: string;

    @ApiProperty({
        enum: ['all', 'recipes', 'tutorials', 'ingredients', 'posts'],
        required: false,
        default: 'all',
    })
    @IsOptional()
    @IsIn(['all', 'recipes', 'tutorials', 'ingredients', 'posts'])
    type?: 'all' | 'recipes' | 'tutorials' | 'ingredients' | 'posts' = 'all';

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 5 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(50)
    limit?: number = 5;
}
