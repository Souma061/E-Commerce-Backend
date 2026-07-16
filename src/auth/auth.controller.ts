import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthGuard } from './guards/auth.guard.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Get('me')
    @UseGuards(AuthGuard)
    async getMe(@CurrentUser() user: { userId: string; role: string }) {
        const profile = await this.usersService.findById(user.userId);
        return {
            id: profile?.id,
            email: profile?.email,
            name: profile?.name,
            role: profile?.role,
            createdAt: profile?.createdAt,
        };
    }

    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const sessionToken = await this.authService.login(dto);

        response.cookie('session', sessionToken, {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            message: 'Login successful',
        };
    }

    @Post('logout')
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const sessionToken: unknown = request.cookies?.['session'];
        if (typeof sessionToken === 'string') {
            await this.authService.logout(sessionToken);
        }

        response.clearCookie('session', {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax',
        });

        return {
            message: 'Logout successful',
        };
    }
}
