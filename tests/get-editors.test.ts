import axios from 'axios';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { config, login } from './utils';

const assertAnEditor = (item: object): void => {
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('aff');
    expect(item).toHaveProperty('focuses');
    expect(item).toHaveProperty('expertises');
};

describe('GetEditors', (): void => {
    it('returns senior editors if token valid', async (): Promise<void> => {
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
            const { status, data } = await axios.get('http://localhost:3001/editors?role=seniorEditor', {
                headers: {
                    Authorization: `Bearer ${signedToken}`,
                },
            });

            expect(status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data[0].id).toBe('9000001');
            expect(data[1].id).toBe('9000002');

            assertAnEditor(data[0]);
            assertAnEditor(data[1]);
        } finally {
        }
    });
    it('returns reviewing editors if token valid', async (): Promise<void> => {
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
            const { status, data } = await axios.get('http://localhost:3001/editors?role=reviewingEditor', {
                headers: {
                    Authorization: `Bearer ${signedToken}`,
                },
            });

            expect(status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data[0].id).toBe('a0000001');
            expect(data[1].id).toBe('a0000002');

            assertAnEditor(data[0]);
            assertAnEditor(data[1]);
        } finally {
        }
    });
});
