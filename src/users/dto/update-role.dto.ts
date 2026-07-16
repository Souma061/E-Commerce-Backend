import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '../../generated/prisma/enums.js';

export class UpdateRoleDto {
    @IsUUID()
    userId!: string;

    @IsEnum(Role)
    role!: Role;
}
