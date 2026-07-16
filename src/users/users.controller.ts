import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Role } from '../generated/prisma/enums.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Patch('role')
    @Roles(Role.ADMIN)
    async updateRole(@Body() dto: UpdateRoleDto) {
        await this.usersService.updateRole(dto.userId, dto.role);
        return {
            message: 'Role updated successfully',
        };
    }
}
