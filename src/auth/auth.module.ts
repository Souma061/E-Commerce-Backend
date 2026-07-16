import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginRateLimitService } from './services/login-rate-limit.service.js';
import { PasswordService } from './services/password.service.js';
import { SessionService } from './services/session-service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Global()
@Module({
    imports: [UsersModule],
    providers: [
        PasswordService,
        AuthService,
        SessionService,
        LoginRateLimitService,
        AuthGuard,
        RolesGuard,
    ],
    exports: [AuthGuard, RolesGuard, SessionService],
    controllers: [AuthController],
})
export class AuthModule {}
