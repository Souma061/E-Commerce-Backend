import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

    async checkout(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true, variant: true } } },
        });
        if (!cart || cart.items.length === 0) {
            throw new NotFoundException('Cart is empty');
        }

        const subtotal = cart.items.reduce((sum, item) => {
            const price = item.variant?.price ?? item.product.price;
            return sum + Number(price) * item.quantity;
        }, 0);

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId,
                    subtotalAmount: subtotal,
                    totalAmount: subtotal,
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            variantId: item.variantId,
                            productTitle: item.product.title,
                            variantName: item.variant?.name,
                            sku: item.variant?.sku,
                            quantity: item.quantity,
                            unitPrice:
                                item.variant?.price ?? item.product.price,
                            totalPrice:
                                Number(
                                    item.variant?.price ?? item.product.price,
                                ) * item.quantity,
                        })),
                    },
                },
                include: { items: true },
            });

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            return order;
        });
    }

    findAll(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(userId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }
}
