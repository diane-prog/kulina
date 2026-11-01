import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateSessionStepDto {
    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsInt({ message: 'Position must be an integer' })
    @Min(1)
    position: number;
}
