import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { SessionService } from '../services/session-service.js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly sessionService: SessionService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token: unknown = request.cookies?.session;

        if (typeof token !== 'string') {
            throw new UnauthorizedException('Authentication required');
        }

        const session = await this.sessionService.getSession(token);

        if (!session) {
            throw new UnauthorizedException(
                'Session expired or invalid. Please login again.',
            );
        }

        request.user = { userId: session.userId, role: session.role };
        return true;
    }
}
