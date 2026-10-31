import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserStatus } from '../../../common/enum/user.enum';

export class QueryUsersDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Query must be a string' })
    query?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Role label must be a string' })
    roleLabel?: string;

    @ApiProperty({ enum: UserStatus, required: false })
    @IsOptional()
    @IsEnum(UserStatus, { message: 'Status is not valid' })
    status?: UserStatus;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1, { message: 'Page must be at least 1' })
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1, { message: 'Limit must be at least 1' })
    @Max(100, { message: 'Limit cannot exceed 100' })
    limit?: number = 10;
}
