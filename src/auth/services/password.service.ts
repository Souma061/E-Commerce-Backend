import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'node:crypto';

@Injectable()
export class PasswordService {
    private readonly pepper: string;
    private readonly saltRounds: number;

    constructor(private readonly configService: ConfigService) {
        this.pepper = this.configService.getOrThrow<string>('PASSWORD_PEPPER'); // Get the pepper value from environment variables.getorthrow is appropriate because it will throw an error if the value is not found, which is important for security.
        this.saltRounds = parseInt(
            this.configService.getOrThrow<string>('PASSWORD_SALT_ROUNDS'),
            10,
        );
    }

    private preProcessPassword(password: string): string {
        return createHmac('sha256', this.pepper)
            .update(password, 'utf-8')
            .digest('base64');
    }

    async hashPassword(password: string): Promise<string> {
        const processPassword = this.preProcessPassword(password);
        return await bcrypt.hash(processPassword, this.saltRounds);
    }

    async comparePassword(
        password: string,
        hashedPassword: string,
    ): Promise<boolean> {
        const processPassword = this.preProcessPassword(password);
        return await bcrypt.compare(processPassword, hashedPassword);
    }
}
