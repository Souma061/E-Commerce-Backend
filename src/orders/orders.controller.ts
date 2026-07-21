import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('checkout')
    checkout(@CurrentUser('userId') userId: string) {
        return this.ordersService.checkout(userId);
    }

    @Get()
    findAll(@CurrentUser('userId') userId: string) {
        return this.ordersService.findAll(userId);
    }

    @Get(':id')
    findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
        return this.ordersService.findOne(userId, id);
    }
}
