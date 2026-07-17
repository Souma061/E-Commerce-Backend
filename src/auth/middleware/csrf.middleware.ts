import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    private readonly csrfSecret =
        process.env.CSRF_SECRET ||
        'default-csrf-secret-key-change-this-in-prod';

    use(request: Request, response: Response, next: NextFunction) {
        const tokenCookieName = 'csrf-token';
        const tokenHeaderName = 'x-csrf-token';

        const cookies = (request.cookies as Record<string, string>) || {};
        let csrfCookie = cookies[tokenCookieName];
        if (!csrfCookie) {
            const randomEntropy = randomBytes(16).toString('hex');
            const signedToken = createHmac('sha256', this.csrfSecret)
                .update(randomEntropy)
                .digest('hex');
            csrfCookie = `${randomEntropy}.${signedToken}`;

            // set the cookie
            response.cookie(tokenCookieName, csrfCookie, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 3600 * 24, // 24 hours
            });
        }

        const stateChangingMethds = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (stateChangingMethds.includes(request.method)) {
            const headerToken = request.headers[tokenHeaderName];
            if (!headerToken || typeof headerToken !== 'string') {
                throw new ForbiddenException('CSRF token missing');
            }
            if (headerToken !== csrfCookie) {
                throw new ForbiddenException('Invalid CSRF token');
            }
            const [entropy, signature] = headerToken.split('.');
            if (!entropy || !signature) {
                throw new ForbiddenException('Invalid CSRF token');
            }
            const expectedSignature = createHmac('sha256', this.csrfSecret)
                .update(entropy)
                .digest('hex');
            if (signature !== expectedSignature) {
                throw new ForbiddenException('Invalid CSRF token');
            }
        }
        next();
    }
}
