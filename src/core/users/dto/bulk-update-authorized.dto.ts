import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkUpdateAuthorizedDto {
    @ApiProperty({ type: [String] })
    @IsArray({ message: 'Ids must be an array' })
    @ArrayMinSize(1, { message: 'At least one id is required' })
    @IsUUID('4', { each: true, message: 'Each id must be a valid UUID' })
    ids: string[];

    @ApiProperty()
    @IsBoolean({ message: 'isAuthorized must be a boolean' })
    isAuthorized: boolean;
}
