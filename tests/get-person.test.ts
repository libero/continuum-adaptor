import axios from 'axios';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { config, login } from './utils';

describe('GetEditors', (): void => {
    it('returns person', async (): Promise<void> => {
        const { decodedToken } = await login();

        const tokenPayload = {
            sub: decodedToken['sub'],
            issuer: 'libero',
            jti: v4(),
        };

        const signedToken = sign(tokenPayload, config.authentication_jwt_secret, {
            expiresIn: '30m',
            issuer: 'continuum-adaptor',
        });

        try {
            const { status, data } = await axios.get('http://localhost:3001/people/ewwboc7m', {
                headers: {
                    Authorization: `Bearer ${signedToken}`,
                },
            });

            expect(status).toBe(200);
            expect(data).toEqual({
                id: 'ewwboc7m',
                type: {
                    id: 'author',
                    label: 'Author',
                },
                name: {
                    preferred: 'reviewer libero',
                    index: 'libero, reviewer',
                },
            });
        } finally {
        }
    });
});
