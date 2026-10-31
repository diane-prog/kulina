import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../common/enum/user.enum';

export class AdminUpdateUserDto {
    @ApiProperty({ enum: UserStatus, required: false })
    @IsOptional()
    @IsEnum(UserStatus, { message: 'Status is not valid' })
    status?: UserStatus;

    @ApiProperty({ example: 'moderator', required: false })
    @IsOptional()
    @IsString({ message: 'Role label must be a string' })
    roleLabel?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isAuthorized must be a boolean' })
    isAuthorized?: boolean;
}
