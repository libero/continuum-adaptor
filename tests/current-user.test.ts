import axios from 'axios';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { config, login } from './utils';

describe('GetCurrentUser', (): void => {
    it('returns unauthorized if token not supplied', async (): Promise<void> => {
        try {
            await axios.get('http://localhost:3001/current-user');
        } catch ({ response }) {
            expect(response.status).toBe(401);
        }
    });

    it('returns unauthorized if token invalid', async (): Promise<void> => {
        try {
            await axios.get('http://localhost:3001/current-user', {
                headers: {
                    Authorization: `Bearer invalid-token`,
                },
            });
        } catch ({ response }) {
            expect(response.status).toBe(401);
        }
    });

    it('returns user if token valid', async (): Promise<void> => {
        const { decodedToken } = await login();

        const tokenPayload = {
            sub: decodedToken['sub'],
            issuer: 'libero',
            jti: v4(),
        };

        const signedToken = sign(tokenPayload, config.authentication_jwt_secret, {
            expiresIn: '30m',
            issuer: 'continuum-auth',
        });

        try {
            const { status, data } = await axios.get('http://localhost:3001/current-user', {
                headers: {
                    Authorization: `Bearer ${signedToken}`,
                },
            });

            expect(status).toBe(200);
            expect(data.id).toHaveLength(36);
            expect(data.name).toBe('TEST_PREFERRED_NAME');
            expect(data.role).toBe('author');
        } finally {
        }
    });
});
