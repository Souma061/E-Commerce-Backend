import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';

@Global()
@Module({
    providers: [RedisService],
    imports: [],
    exports: [RedisService],
})
export class RedisModule {}
