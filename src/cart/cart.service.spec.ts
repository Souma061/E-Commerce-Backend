import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

describe('CartService', () => {
    let service: CartService;
    let prisma: Record<string, any>;

    const mockPrismaService = {
        cart: {
            findUnique: async () => null,
            create: async (args: any) => args.data,
        },
        product: {
            findUnique: async () => null,
        },
        productVariant: {
            findUnique: async () => null,
        },
        cartItem: {
            findFirst: async () => null,
            update: async (args: any) => args.data,
            create: async (args: any) => args.data,
            delete: async () => undefined,
            deleteMany: async () => undefined,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
        prisma = module.get(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findCart', () => {
        it('should return existing cart and items', async () => {
            const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };
            prisma.cart.findUnique = async () => mockCart;

            const result = await service.findCart('user-1');
            expect(result).toEqual(mockCart);
        });

        it('should return null ID object if cart not found', async () => {
            prisma.cart.findUnique = async () => null;

            const result = await service.findCart('user-1');
            expect(result).toEqual({ id: null, items: [] });
        });
    });

    describe('addItem', () => {
        const mockCart = { id: 'cart-1', userId: 'user-1' };
        const mockProduct = { id: 'prod-1', title: 'Product 1' };
        const mockVariant = { id: 'var-1', productId: 'prod-1' };

        beforeEach(() => {
            prisma.cart.findUnique = async () => mockCart;
            prisma.product.findUnique = async () => mockProduct;
            prisma.productVariant.findUnique = async () => mockVariant;
        });

        it('should throw NotFoundException if product does not exist', async () => {
            prisma.product.findUnique = async () => null;
            await expect(
                service.addItem('user-1', { productId: 'prod-1' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if variant does not exist', async () => {
            prisma.productVariant.findUnique = async () => null;
            await expect(
                service.addItem('user-1', {
                    productId: 'prod-1',
                    variantId: 'var-1',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should increment quantity if item already exists', async () => {
            prisma.cartItem.findFirst = async () => ({
                id: 'item-1',
                cartId: 'cart-1',
                productId: 'prod-1',
                variantId: null,
                quantity: 2,
            });
            prisma.cartItem.update = async (_args: any) => ({
                id: 'item-1',
                cartId: 'cart-1',
                productId: 'prod-1',
                variantId: null,
                quantity: 3,
            });

            const result = await service.addItem('user-1', {
                productId: 'prod-1',
                quantity: 1,
            });
            expect(result.quantity).toBe(3);
        });

        it('should create new item if item does not exist', async () => {
            prisma.cartItem.findFirst = async () => null;
            const newItem = {
                id: 'item-1',
                cartId: 'cart-1',
                productId: 'prod-1',
                variantId: null,
                quantity: 2,
            };
            prisma.cartItem.create = async () => newItem;

            const result = await service.addItem('user-1', {
                productId: 'prod-1',
                quantity: 2,
            });
            expect(result).toEqual(newItem);
        });
    });

    describe('updateItem', () => {
        const mockCart = { id: 'cart-1', userId: 'user-1' };
        beforeEach(() => {
            prisma.cart.findUnique = async () => mockCart;
        });

        it('should throw NotFoundException if cart item does not exist in user cart', async () => {
            prisma.cartItem.findFirst = async () => null;
            await expect(
                service.updateItem('user-1', 'item-1', { quantity: 5 }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update item quantity if exists', async () => {
            const existingItem = {
                id: 'item-1',
                cartId: 'cart-1',
                productId: 'prod-1',
                quantity: 2,
            };
            prisma.cartItem.findFirst = async () => existingItem;
            prisma.cartItem.update = async (_args: any) => ({
                ...existingItem,
                quantity: 5,
            });

            const result = await service.updateItem('user-1', 'item-1', {
                quantity: 5,
            });
            expect(result.quantity).toBe(5);
        });
    });

    describe('removeItem', () => {
        const mockCart = { id: 'cart-1', userId: 'user-1' };
        beforeEach(() => {
            prisma.cart.findUnique = async () => mockCart;
        });

        it('should throw NotFoundException if item does not exist in user cart', async () => {
            prisma.cartItem.findFirst = async () => null;
            await expect(
                service.removeItem('user-1', 'item-1'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should delete item and return success message', async () => {
            const existingItem = {
                id: 'item-1',
                cartId: 'cart-1',
                productId: 'prod-1',
                quantity: 2,
            };
            prisma.cartItem.findFirst = async () => existingItem;

            const result = await service.removeItem('user-1', 'item-1');
            expect(result).toEqual({ message: 'Item removed successfully' });
        });
    });

    describe('clearCart', () => {
        const mockCart = { id: 'cart-1', userId: 'user-1' };
        beforeEach(() => {
            prisma.cart.findUnique = async () => mockCart;
        });

        it('should delete all cart items for user cart', async () => {
            const result = await service.clearCart('user-1');
            expect(result).toEqual({ message: 'Cart cleared successfully' });
        });
    });
});
