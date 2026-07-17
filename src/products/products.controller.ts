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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Role } from '../generated/prisma/enums.js';
import { CreateProductDto } from './dto/create-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    create(
        @Body() dto: CreateProductDto,
        @CurrentUser('userId') sellerId: string,
    ) {
        return this.productsService.create(dto, sellerId);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':slug')
    findBySlug(@Param('slug') slug: string) {
        return this.productsService.findBySlug(slug);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
        @CurrentUser() user: { userId: string; role: Role },
    ) {
        return this.productsService.update(id, dto, user);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    remove(
        @Param('id') id: string,
        @CurrentUser() user: { userId: string; role: Role },
    ) {
        return this.productsService.remove(id, user);
    }
}
