import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RecipeStatus } from '../../../common/enum/recipe.enum';

export class UpdateRecipeStatusDto {
    @ApiProperty({ enum: RecipeStatus })
    @IsEnum(RecipeStatus, { message: 'Status is not valid' })
    status: RecipeStatus;
}
