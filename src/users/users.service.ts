import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface CreateUserDto {
    email: string;
    password: string;
    name: string;
}

@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

    findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: { email },
        });
    }

    createUser(data: CreateUserDto) {
        return this.prismaService.user.create({
            data: {
                email: data.email,
                passwordHash: data.password,
                name: data.name,
            },
        });
    }

    findById(id: string) {
        return this.prismaService.user.findUnique({
            where: { id },
        });
    }

    updateUser(id: string, data: Partial<CreateUserDto>) {
        return this.prismaService.user.update({
            where: { id },
            data,
        });
    }

    deleteUser(id: string) {
        return this.prismaService.user.delete({
            where: { id },
        });
    }

    findAll() {
        return this.prismaService.user.findMany();
    }
}
