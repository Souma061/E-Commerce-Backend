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
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Role } from '../generated/prisma/enums.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}
    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    create(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(dto);
    }
    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }
    @Get(':slug')
    findBySlug(@Param('slug') slug: string) {
        return this.categoriesService.findBySlug(slug);
    }
    @Patch(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoriesService.update(id, dto);
    }
    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
