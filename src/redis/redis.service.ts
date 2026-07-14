import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
    private readonly redisClient: Redis;

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');

        this.redisClient = new Redis(redisUrl, {
            lazyConnect: true,
        });
        this.redisClient.on('error', (err) => {
            console.error('Redis Error', err);
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.redisClient.quit();
        console.log('Redis disconnected');
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.redisClient.connect();
            console.log('Redis connected successfully');
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async set(key: string, value: string, ttlSecond?: number): Promise<void> {
        if (ttlSecond) {
            await this.redisClient.set(key, value, 'EX', ttlSecond);
            return;
        }
        await this.redisClient.set(key, value);
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    async incr(key: string): Promise<void> {
        await this.redisClient.incr(key); // increment the key by 1
    }

    async decr(key: string): Promise<void> {
        await this.redisClient.decr(key); // decrement the key by 1
    }

    async expire(key: string, ttlSecond: number): Promise<void> {
        await this.redisClient.expire(key, ttlSecond);
    }

    async ttl(key: string): Promise<number> {
        return this.redisClient.ttl(key);
    }
    async incrementWithExpiry(key: string, ttlSecond: number): Promise<number> {
        const result = await this.redisClient.eval(
            `
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
        `,
            1,
            key,
            ttlSecond,
        );
        return result as number;
    }
}
// we have add this inccrementWithExpiry method becuase: incr -> app crashes -> expiry never happens.
// but in this method we performed conditional expiry.

// in redis: commands are executed in single thread.
// so,it's atomic.

// lua script + eval() is atomic
