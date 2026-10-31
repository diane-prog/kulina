import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RecipeStepDto {
    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Step number must be an integer' })
    @Min(1)
    stepNumber?: number;

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
    @IsInt({ message: 'Video timestamp must be an integer' })
    @Min(0)
    videoTimestampSeconds?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Duration must be an integer' })
    @Min(0)
    durationMinutes?: number;
}
