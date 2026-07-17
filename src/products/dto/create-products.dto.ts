import { Type } from 'class-transformer';
import {
    IsArray,
    IsDecimal,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class CreateVarientDto {
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    sku: string;

    @IsString()
    @MinLength(1)
    @MaxLength(64)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(16)
    size?: string;

    @IsOptional()
    @IsString()
    @MaxLength(32)
    color?: string;

    @IsDecimal({ decimal_digits: '2' })
    price: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;
}

export class CreateProductDto {
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    title: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(256)
    description?: string;

    @IsString()
    categoryId: string;

    @IsDecimal({ decimal_digits: '2' })
    price: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateVarientDto)
    variants?: CreateVarientDto[];
}
