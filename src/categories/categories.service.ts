import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
@Injectable()
export class CategoriesService {
    constructor(private readonly prismaService: PrismaService) {}

    async create(dto: CreateCategoryDto) {
        const slug = await this.generateSlug(dto.name);
        return this.prismaService.category.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description,
            },
        });
    }
    findAll() {
        return this.prismaService.category.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async findBySlug(slug: string) {
        const category = await this.prismaService.category.findUnique({
            where: { slug },
        });
        if (!category) throw new NotFoundException('Category Not Found');
        return category;
    }
    async update(id: string, dto: UpdateCategoryDto) {
        const data: Prisma.CategoryUpdateInput = {};
        if (dto.name !== undefined) {
            data.name = dto.name;
            data.slug = await this.generateSlug(dto.name, id);
        }
        if (dto.description !== undefined) {
            data.description = dto.description;
        }
        try {
            return await this.prismaService.category.update({
                where: { id },
                data,
            });
        } catch (err) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2025'
            ) {
                throw new NotFoundException('Category not found');
            }
            throw err;
        }
    }
    async remove(id: string) {
        try {
            return await this.prismaService.category.delete({
                where: { id },
            });
        } catch (err) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2025'
            ) {
                throw new NotFoundException('Category not found');
            }
            throw err;
        }
    }
    private async generateSlug(
        name: string,
        excludeId?: string,
    ): Promise<string> {
        const base = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        let slug = base;
        let suffix = 0;
        while (await this.slugExists(slug, excludeId)) {
            suffix++;
            slug = `${base}-${suffix}`;
        }
        return slug;
    }
    private async slugExists(
        slug: string,
        excludeId?: string,
    ): Promise<boolean> {
        const existing = await this.prismaService.category.findUnique({
            where: { slug },
        });
        if (!existing) return false;
        if (excludeId && existing.id === excludeId) return false;
        return true;
    }
}
