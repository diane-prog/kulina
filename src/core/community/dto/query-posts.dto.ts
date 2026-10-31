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
import { PostType } from '../../../common/enum/community.enum';

export class QueryPostsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    query?: string;

    @ApiProperty({ enum: PostType, required: false })
    @IsOptional()
    @IsEnum(PostType, { message: 'Post type is not valid' })
    type?: PostType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'Recipe id must be a valid UUID' })
    recipeId?: string;

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
