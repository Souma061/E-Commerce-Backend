import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginRateLimitService } from './services/login-rate-limit.service.js';
import { PasswordService } from './services/password.service.js';
import { SessionService } from './services/session-service.js';
@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
        private readonly loginRatelimitService: LoginRateLimitService,
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

    async login(dto: LoginDto): Promise<string> {
        const email = dto.email.trim().toLowerCase();

        // 1. Check rate limit
        await this.loginRatelimitService.check(email);

        const user = await this.userService.findByEmail(email);
        if (!user) {
            await this.loginRatelimitService.recordFailure(email);
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordHash =
            user?.passwordHash ?? this.passwordService.getDummyhash();

        const isPasswordValid = await this.passwordService.comparePassword(
            dto.password,
            passwordHash,
        );
        if (!isPasswordValid) {
            await this.loginRatelimitService.recordFailure(email);
            throw new UnauthorizedException('Invalid email or password');
        }

        // 2. Reset rate limit on success
        await this.loginRatelimitService.reset(email);

        // 3. Create session and return token
        const token = await this.sessionService.createSession(
            user.id,
            user.role,
        );
        return token;
    }

    async logout(token: string): Promise<void> {
        await this.sessionService.deleteSession(token);
    }
}
