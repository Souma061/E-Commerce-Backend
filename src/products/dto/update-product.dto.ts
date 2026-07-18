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
export class UpdateVariantDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    sku?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(16)
    size?: string;

    @IsOptional()
    @IsString()
    @MaxLength(32)
    color?: string;

    @IsOptional()
    @IsDecimal({ decimal_digits: '2' })
    price?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;
}
export class UpdateProductDto {
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    title: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(256)
    description?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsDecimal({ decimal_digits: '2' })
    price?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateVariantDto)
    variants?: UpdateVariantDto[];
}
