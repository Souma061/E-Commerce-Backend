import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    description?: string;
}
