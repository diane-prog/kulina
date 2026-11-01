import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class RecipeStepDto {
    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Position must be an integer' })
    @Min(1)
    position?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    title?: string;

    @ApiProperty({ example: 'Wash and chop the tomatoes.' })
    @IsNotEmpty({ message: 'Instruction is required' })
    @IsString({ message: 'Instruction must be a string' })
    instruction: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    imageUrl?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Ideal seconds must be an integer' })
    @Min(0)
    idealSeconds?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Minimum seconds must be an integer' })
    @Min(0)
    minSeconds?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Maximum seconds must be an integer' })
    @Min(0)
    maxSeconds?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean({ message: 'isCritical must be a boolean' })
    isCritical?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Tip must be a string' })
    tip?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Narration must be a string' })
    narrationText?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'Audio URL must be a string' })
    audioUrl?: string;
}
