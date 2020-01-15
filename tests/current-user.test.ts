/* eslint-disable prettier/prettier */
import axios from 'axios';
import { readFileSync } from 'fs';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';

const configPath = `${__dirname}/config/continuum-adaptor.json`;
const config = JSON.parse(readFileSync(configPath, 'utf8'));

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
            await axios.get(
                'http://localhost:3001/current-user',
                {
                    headers: {
                        Authorization: `Bearer invalid-token`
                    }
                }
            );
        } catch ({ response }) {
            expect(response.status).toBe(401);
        }
    });

    it('returns user if token valid', async (): Promise<void> => {
        const payload = {
            "token_id": v4(),
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
            }
        }

        const signedToken = sign(
            payload,
            config.authentication_jwt_secret,
            { expiresIn: '30m', issuer: 'continuum-auth' }
        );

        try {
            const response = await axios.get(
                'http://localhost:3001/current-user',
                {
                    headers: {
                        Authorization: `Bearer ${signedToken}`
                    }
                }
            );

            expect(response.status).toBe(200);
        } finally {}
    });
});
