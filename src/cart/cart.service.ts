import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) {}

    private async getOrCreateCart(userId: string) {
        let cart = await this.prisma.cart.findUnique({
            where: { userId },
        });
        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { userId: userId },
            });
        }
        return cart;
    }
    async findCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                price: true,
                            },
                        },
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                price: true,
                                stockQuantity: true,
                            },
                        },
                    },
                },
            },
        });
        return cart ?? { id: null, items: [] };
    }
    async addItem(userId: string, dto: AddToCartDto) {
        const cart = await this.getOrCreateCart(userId);
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });
        if (!product) throw new NotFoundException('Product Not Found');

        if (dto.variantId) {
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: dto.variantId },
            });
            if (!variant) throw new NotFoundException('Variant Not found');
        }
        const existing = await this.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: dto.productId,
                variantId: dto.variantId ?? null,
            },
        });
        if (existing) {
            return this.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + (dto.quantity ?? 1) },
            });
        }

        return this.prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: dto.productId,
                variantId: dto.variantId ?? null,
                quantity: dto.quantity ?? 1,
            },
        });
    }
    async updateItem(userId: string, itemId: string, dto: UpdateCartDto) {
        const cart = await this.getOrCreateCart(userId);
        const item = await this.prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
        });
        if (!item) {
            throw new NotFoundException('Item not found');
        }
        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity },
        });
    }
    async removeItem(userId: string, itemId: string) {
        const cart = await this.getOrCreateCart(userId);
        const item = await this.prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
        });
        if (!item) {
            throw new NotFoundException('Item not found');
        }
        await this.prisma.cartItem.delete({
            where: { id: itemId },
        });
        return { message: 'Item removed successfully' };
    }
    async clearCart(userId: string) {
        const cart = await this.getOrCreateCart(userId);
        await this.prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
        return { message: 'Cart cleared successfully' };
    }
}
