import {
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';

export class AddToCartDto {
    @IsString()
    @MinLength(1)
    productId: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    variantId?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    quantity?: number;
}
