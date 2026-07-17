import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}
    async create(dto: CreateProductDto, sellerId: string) {
        const slug = await this.generateSlug(dto.title);
        const category = await this.prisma.category.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category)
            throw new NotFoundException(`no category ${dto.categoryId} found`);

        if (dto.variants?.length) {
            const existing = await this.prisma.productVariant.findFirst({
                where: { sku: { in: dto.variants.map((v) => v.sku) } },
            });
            if (existing)
                throw new ConflictException(
                    `SKU "${existing.sku}" already exists`,
                );
        }

        return this.prisma.product.create({
            data: {
                title: dto.title,
                slug,
                description: dto.description,
                price: dto.price,
                stockQuantity: dto.stockQuantity ?? 0,
                categoryId: dto.categoryId,
                sellerId,
                variants: dto.variants?.length
                    ? {
                          create: dto.variants.map((v) => ({
                              sku: v.sku,
                              name: v.name,
                              size: v.size,
                              color: v.color,
                              price: v.price,
                              stockQuantity: v.stockQuantity ?? 0,
                          })),
                      }
                    : undefined,
            },
            include: {
                variants: true,
            },
        });
    }
    findAll() {
        return this.prisma.product.findMany({
            where: { isActive: true },
            include: { category: true, variants: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: { category: true, variants: true },
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async remove(id: string, user: { userId: string; role: Role }) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product) throw new NotFoundException('Product not found');

        if (user.role === Role.SELLER && product.sellerId !== user.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this product',
            );
        }

        return this.prisma.product.delete({
            where: { id },
        });
    }
    async update(
        id: string,
        dto: UpdateProductDto,
        user: { userId: string; role: Role },
    ) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
            include: { variants: true },
        });
        if (!existing) throw new NotFoundException('Product not found');

        if (user.role === Role.SELLER && existing.sellerId !== user.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this product',
            );
        }

        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) throw new NotFoundException('Category not found');
        }
        const data: Prisma.ProductUpdateInput = {};
        if (dto.title !== undefined) {
            data.title = dto.title;
            data.slug = await this.generateSlug(dto.title, id);
        }
        if (dto.description !== undefined) {
            data.description = dto.description;
        }
        if (dto.categoryId !== undefined) {
            data.category = {
                connect: { id: dto.categoryId },
            };
        }
        if (dto.price !== undefined) {
            data.price = dto.price;
        }
        if (dto.stockQuantity !== undefined) {
            data.stockQuantity = dto.stockQuantity;
        }
        if (dto.variants !== undefined) {
            if (dto.variants.length === 0) {
                data.variants = { deleteMany: {} };
            } else {
                const skus = dto.variants
                    .filter((v) => v.sku)
                    .map((v) => v.sku!);
                if (skus.length) {
                    const dup = await this.prisma.productVariant.findFirst({
                        where: { sku: { in: skus }, productId: { not: id } },
                    });
                    if (dup)
                        throw new ConflictException(
                            `SKU ${dup.sku} already exists`,
                        );
                }
                data.variants = {
                    deleteMany: {},
                    create: dto.variants.map((v) => {
                        const existingVariant = existing.variants.find(
                            (ev) => ev.sku === v.sku,
                        );
                        return {
                            sku: v.sku ?? existingVariant?.sku ?? '',
                            name: v.name ?? existingVariant?.name ?? '',
                            size: v.size ?? existingVariant?.size,
                            color: v.color ?? existingVariant?.color,
                            price: v.price ?? existingVariant?.price ?? '0.00',
                            stockQuantity:
                                v.stockQuantity ??
                                existingVariant?.stockQuantity ??
                                0,
                        };
                    }),
                };
            }
        }
        return this.prisma.product.update({
            where: { id },
            data,
            include: { variants: true, category: true },
        });
    }

    private async generateSlug(
        title: string,
        excludeId?: string,
    ): Promise<string> {
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const base = slug;
        let suffix = 1;
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
        const existing = await this.prisma.product.findUnique({
            where: { slug },
        });
        if (!existing) return false;
        if (excludeId && existing.id === excludeId) return false;
        return true;
    }
}
