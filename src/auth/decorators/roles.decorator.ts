import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums.js';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
