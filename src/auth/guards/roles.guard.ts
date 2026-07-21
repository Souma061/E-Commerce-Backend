import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/enums.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            'roles',
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{
            user?: { userId: string; role: Role };
        }>();
        const user = request.user;

        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException(
                'You do not have permission to access this resource',
            );
        }

        return true;
    }
}
