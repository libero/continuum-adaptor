/* eslint-disable prettier/prettier */
import axios from 'axios';
import { Server } from 'http';
import { readFileSync } from 'fs';
import * as express from 'express';
import { sign, verify } from 'jsonwebtoken';
const configPath = `${__dirname}/config/continuum-auth.json`;
const config = JSON.parse(readFileSync(configPath, 'utf8'));

// port the mocked profile / redirect server will expose
const MOCK_SERVER_PORT = 3002;
// time in ms from now the mock journal token will be valid for
const MOCK_TOKEN_EXP = 20000

describe('Authenticate', (): void => {
    let server: Server;
    beforeAll(() => {
        const app: express.Express = express();
        app.get('/redirect_destination', (_, resp) => {
            resp.status(200).send('Successful redirect');
        });
        app.get('/profiles/*', (_, resp) => {
            resp.status(200).json({
                id: 'TEST_ID',
                name: {
                    preferred: 'TEST_PREFERRED_NAME',
                    index: 'TEST_INDEX_NAME',
                },
                orcid: '0000-0001-2345-6789',
                emailAddresses: [
                    {
                        value: 'test@example.com'
                    }
                ],
                affiliations: [],
            });
        });
        server = app.listen(MOCK_SERVER_PORT);
    });

    afterAll(() => {
        server.close();
    });

    // happy path
    it('authenticates a user session token', async (): Promise<void> => {
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

        expect.assertions(8);
        await axios.get(`http://localhost:3001/authenticate/${mockJournalToken}`).then(res => {
            expect(res.status).toBe(200);
            expect(res.data).toBe('Successful redirect')
            const [redirectUrl, returnedToken] = res.request.res.responseUrl.split('#');
            expect(redirectUrl).toBe(config.login_return_url);
            const verifiedReturnToken = verify(returnedToken, config.authentication_jwt_secret);

            const expectedPayload =     {
                "token_version": "0.1-alpha",
                "identity": {
                    "external": [
                        {
                            "id": "TEST_ID",
                            "domain": "elife-profiles"
                        },
                        {
                            "id": "0000-0001-2345-6789",
                            "domain": "orcid"
                        }
                    ]
                },
                "roles": [
                    {
                        "journal": "elife",
                        "kind": "author"
                    }
                ],
                "meta": {
                    "email": "test@example.com"
                },
                "iss": "continuum-auth"
            };

            expect(typeof verifiedReturnToken['iat']).toBe('number');
            delete verifiedReturnToken['iat'];

            expect(typeof verifiedReturnToken['exp']).toBe('number');
            delete verifiedReturnToken['exp'];

            expect(typeof verifiedReturnToken['identity']['user_id']).toBe('string');
            delete verifiedReturnToken['identity']['user_id'];

            expect(typeof verifiedReturnToken['token_id']).toBe('string');
            delete verifiedReturnToken['token_id'];

            expect(verifiedReturnToken).toStrictEqual(expectedPayload);
        });
    });

    it('rejects request when no token passed', async (): Promise<void> => {
        expect.assertions(2)
        await axios.get('http://localhost:3001/authenticate').catch(({response}) => {
            expect(response.status).toBe(500);
            expect(response.data).toEqual({ ok: false, msg: 'No token' })
        });
    });

    it('rejects request when invalid token passed', async (): Promise<void> => {
        expect.assertions(2)
        await axios.get('http://localhost:3001/authenticate/INVALID_TOKEN').catch(({response}) => {
            expect(response.status).toBe(500);
            expect(response.data).toEqual({ ok: false, msg: 'Invalid token' })
        });
    });
});
