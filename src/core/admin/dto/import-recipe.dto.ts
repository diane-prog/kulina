import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImportRecipeDto {
    @ApiProperty({
        description: 'Recipe YAML or JSON content',
        example: 'slug: bouillie-de-riz\ntitle: Bouillie de riz',
    })
    @IsNotEmpty({ message: 'YAML content is required' })
    @IsString({ message: 'YAML content must be a string' })
    yaml: string;
}
