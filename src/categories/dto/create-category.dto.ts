import { IsString, MaxLength, MinLength } from 'class-validator';
export class CreateCategoryDto {
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    name: string;

    @IsString()
    @MinLength(3)
    @MaxLength(200)
    description: string;
}
