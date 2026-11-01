import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StructureRecipeDto {
    @ApiProperty({
        example:
            'Ma mère lave le riz, le laisse tremper 5 minutes, puis le fait cuire 30 minutes...',
    })
    @IsNotEmpty({ message: 'Transcript is required' })
    @IsString({ message: 'Transcript must be a string' })
    transcript: string;
}
