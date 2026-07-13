import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './services/password.service.js';
import { SessionService } from './services/session-service.js';

@Module({
    imports: [UsersModule],
    providers: [PasswordService, AuthService, SessionService],
    // exports: [PasswordService, AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
