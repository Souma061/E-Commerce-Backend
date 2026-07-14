import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class LoginRateLimitService {
    private readonly maxAttempts = 5;
    private readonly windowSeconds = 60 * 10;
    constructor(private readonly RedisService: RedisService) {}

    async check(email: string): Promise<void> {
        const attempts = await this.RedisService.get(this.getkey(email));

        if (attempts !== null && Number(attempts) >= this.maxAttempts) {
            throw new HttpException(
                'Too many login attempts. Please try again later.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }
    async recordFailure(email: string): Promise<void> {
        await this.RedisService.incrementWithExpiry(
            this.getkey(email),
            this.windowSeconds,
        );
    }
    async reset(email: string): Promise<void> {
        await this.RedisService.del(this.getkey(email));
    }

    private getkey(email: string): string {
        const emailHash = createHash('sha256').update(email).digest('hex');

        return `rate_limit:${emailHash}`;
    }
}
// why hasing the email instead of keeping raw:- instead of login_attempt:souma@gmail.com we do login_attempt:dfgh1234567890
// advantages:-no emaail leak by attackers.proper safety measures.
