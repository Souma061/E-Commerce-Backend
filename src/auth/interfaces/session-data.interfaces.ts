import { Role } from '../../generated/prisma/enums.js';
export interface SessionData {
    userId: string;
    role: Role;
}
// keeping the session small.No extra info/overhead
