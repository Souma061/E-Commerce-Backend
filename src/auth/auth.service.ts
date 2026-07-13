import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { PasswordService } from './services/password.service.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly passwordService: PasswordService,
    ) {}

    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();
        const existingUser = await this.userService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException(
                `An account with email ${email} already exists`,
            );
        }
        const hashedPassword = await this.passwordService.hashPassword(
            dto.password,
        );
        const user = await this.userService.createUser({
            email,
            password: hashedPassword,
            name: dto.name.trim(),
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        };
    }

    async login(dto: LoginDto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('No account found with this email');
        }
        const isPasswordValid = await this.passwordService.comparePassword(
            dto.password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Incorrect password');
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
}
