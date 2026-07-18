import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';

describe('CartController', () => {
    let controller: CartController;
    let service: CartService;

    const mockCartService = {
        findCart: async (userId: string) => ({ id: 'cart-1', userId, items: [] }),
        addItem: async (userId: string, dto: any) => ({ id: 'item-1', cartId: 'cart-1', ...dto }),
        updateItem: async (userId: string, itemId: string, dto: any) => ({ id: itemId, ...dto }),
        removeItem: async () => ({ message: 'Item removed successfully' }),
        clearCart: async () => ({ message: 'Cart cleared successfully' }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CartController],
            providers: [
                {
                    provide: CartService,
                    useValue: mockCartService,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<CartController>(CartController);
        service = module.get(CartService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getCart', () => {
        it('should return user cart', async () => {
            const result = await controller.getCart({ userId: 'user-1' });
            expect(result).toEqual({ id: 'cart-1', userId: 'user-1', items: [] });
        });
    });

    describe('addItem', () => {
        it('should add item to cart', async () => {
            const dto = { productId: 'prod-1', quantity: 2 };
            const result = await controller.addItem({ userId: 'user-1' }, dto);
            expect(result).toEqual({ id: 'item-1', cartId: 'cart-1', ...dto });
        });
    });

    describe('updateItem', () => {
        it('should update cart item quantity', async () => {
            const dto = { quantity: 5 };
            const result = await controller.updateItem({ userId: 'user-1' }, 'item-1', dto);
            expect(result).toEqual({ id: 'item-1', quantity: 5 });
        });
    });

    describe('removeItem', () => {
        it('should remove item from cart', async () => {
            const result = await controller.removeItem({ userId: 'user-1' }, 'item-1');
            expect(result).toEqual({ message: 'Item removed successfully' });
        });
    });

    describe('clearCart', () => {
        it('should clear all items in the cart', async () => {
            const result = await controller.clearCart({ userId: 'user-1' });
            expect(result).toEqual({ message: 'Cart cleared successfully' });
        });
    });
});
