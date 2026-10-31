import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ShoppingListStatus } from '../../../common/enum/shopping-list.enum';

export class QueryShoppingListsDto {
    @ApiProperty({ enum: ShoppingListStatus, required: false })
    @IsOptional()
    @IsEnum(ShoppingListStatus, { message: 'Status is not valid' })
    status?: ShoppingListStatus;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
