import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShoppingListStatus } from '../../../common/enum/shopping-list.enum';

export class UpdateShoppingListDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ enum: ShoppingListStatus, required: false })
    @IsOptional()
    @IsEnum(ShoppingListStatus, { message: 'Status is not valid' })
    status?: ShoppingListStatus;
}
