import axios from 'axios';
import { login, LoginReturnValue, config } from './utils';

describe('Authenticate', (): void => {
    // happy path
    it('authenticates a user session token', async (): Promise<void> => {
        await login().then(({ res, redirectUrl, decodedToken }: LoginReturnValue) => {
            expect(res.status).toBe(200);
            expect(res.data).toBe('Redirect reached successfully');
            expect(redirectUrl).toBe(config.login_return_url);

            const expectedPayload = {
                iss: 'continuum-adaptor',
                issuer: 'libero',
            };
            const currentTimestamp = new Date().getTime() / 1000;

            expect(typeof decodedToken['iat']).toBe('number');
            expect(decodedToken['iat']).toBeLessThan(currentTimestamp);

            expect(typeof decodedToken['exp']).toBe('number');
            expect(decodedToken['exp']).toBeGreaterThan(currentTimestamp);

            expect(decodedToken['sub']).toHaveLength(36);
            expect(typeof decodedToken['jti']).toBe('string');
            expect(decodedToken['jti']).toHaveLength(36);

            expect(decodedToken).toMatchObject(expectedPayload);
        });
    });

    it('rejects request when no token passed', async (): Promise<void> => {
        await axios.get('http://localhost:3001/authenticate').catch(({ response }) => {
            expect(response.status).toBe(401);
            expect(response.data).toEqual({ ok: false, msg: 'No token' });
        });
    });

    it('rejects request when invalid token passed', async (): Promise<void> => {
        await axios.get('http://localhost:3001/authenticate?token=INVALID_TOKEN').catch(({ response }) => {
            expect(response.status).toBe(401);
            expect(response.data).toEqual({ ok: false, msg: 'Invalid token' });
        });
    });
});
