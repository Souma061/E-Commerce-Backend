import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Role } from '../../generated/prisma/enums.js';
import { RedisService } from '../../redis/redis.service.js';
import { SessionData } from '../interfaces/session-data.interfaces.js';
@Injectable()
export class SessionService {
    private readonly sessionPrefix = 'session';
    private readonly sessionTtlSeconds = 60 * 60 * 24 * 7; // 7 days
    constructor(private readonly redisService: RedisService) {}
    async createSession(userId: string, role: Role): Promise<string> {
        const token = randomBytes(32).toString('base64url');
        const sessionData: SessionData = {
            userId,
            role,
        };
        await this.redisService.set(
            this.getSessionKey(token),
            JSON.stringify(sessionData),
            this.sessionTtlSeconds,
        );
        return token;
    }
    async getSession(token: string): Promise<SessionData | null> {
        const session = await this.redisService.get(this.getSessionKey(token));
        if (!session) {
            return null;
        }
        return JSON.parse(session) as SessionData;
    }
    async deleteSession(token: string): Promise<void> {
        await this.redisService.del(this.getSessionKey(token));
    }

    private getSessionKey(token: string): string {
        return `${this.sessionPrefix}:${token}`;
    }
}
