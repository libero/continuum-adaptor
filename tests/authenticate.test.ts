/* eslint-disable prettier/prettier */
import axios from 'axios';
import { readFileSync } from 'fs';
import { sign, verify } from 'jsonwebtoken';

const configPath = `${__dirname}/config/continuum-adaptor.json`;
const config = JSON.parse(readFileSync(configPath, 'utf8'));

// time in ms from now the mock journal token will be valid for
const MOCK_TOKEN_EXP = 20000

describe('Authenticate', (): void => {
    // happy path
    it.only('authenticates a user session token', async (): Promise<void> => {
        const mockJournalToken = sign(
            {
                iss: 'journal--prod',
                iat: 1567503944,
                exp: new Date().getTime() + MOCK_TOKEN_EXP,
                id: 'TEST_ID',
                'new-session': true,
            },
            config.continuum_jwt_secret,
        );

        await axios.get(`http://localhost:3001/authenticate/${mockJournalToken}`).then(res => {
            expect(res.status).toBe(200);
            expect(res.data).toBe('Redirect reached successfully')
            const [redirectUrl, returnedToken] = res.request.res.responseUrl.split('#');
            expect(redirectUrl).toBe(config.login_return_url);
            const decoded = verify(returnedToken, config.authentication_jwt_secret);

            const expectedPayload = {
                iss: 'continuum-auth',
                issuer: 'libero',
            };
            const currentTimestamp = new Date().getTime() / 1000;

            expect(typeof decoded['iat']).toBe('number');
            expect(decoded['iat']).toBeLessThan(currentTimestamp);

            expect(typeof decoded['exp']).toBe('number');
            expect(decoded['exp']).toBeGreaterThan(currentTimestamp);

            expect(decoded['sub']).toHaveLength(36);
            expect(typeof decoded['jti']).toBe('string');
            expect(decoded['jti']).toHaveLength(36);

            expect(decoded).toMatchObject(expectedPayload);
        });
    });

    it('rejects request when no token passed', async (): Promise<void> => {
        await axios.get('http://localhost:3001/authenticate').catch(({response}) => {
            expect(response.status).toBe(500);
            expect(response.data).toEqual({ ok: false, msg: 'No token' })
        });
    });

    it('rejects request when invalid token passed', async (): Promise<void> => {
        await axios.get('http://localhost:3001/authenticate/INVALID_TOKEN').catch(({response}) => {
            expect(response.status).toBe(500);
            expect(response.data).toEqual({ ok: false, msg: 'Invalid token' })
        });
    });
});
