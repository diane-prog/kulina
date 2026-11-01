import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CheckoutDto {
    @ApiProperty({ example: 'manual', required: false })
    @IsOptional()
    @IsString({ message: 'Provider must be a string' })
    provider?: string;

    @ApiProperty({ example: 2500, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Amount must be an integer' })
    @Min(0)
    amountXof?: number;
}
