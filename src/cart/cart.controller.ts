import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    async getCart(@CurrentUser() user: { userId: string }) {
        return this.cartService.findCart(user.userId);
    }

    @Post('items')
    async addItem(
        @CurrentUser() user: { userId: string },
        @Body() dto: AddToCartDto,
    ) {
        return this.cartService.addItem(user.userId, dto);
    }

    @Patch('items/:itemId')
    async updateItem(
        @CurrentUser() user: { userId: string },
        @Param('itemId') itemId: string,
        @Body() dto: UpdateCartDto,
    ) {
        return this.cartService.updateItem(user.userId, itemId, dto);
    }

    @Delete('items/:itemId')
    async removeItem(
        @CurrentUser() user: { userId: string },
        @Param('itemId') itemId: string,
    ) {
        return this.cartService.removeItem(user.userId, itemId);
    }

    @Delete()
    async clearCart(@CurrentUser() user: { userId: string }) {
        return this.cartService.clearCart(user.userId);
    }
}
