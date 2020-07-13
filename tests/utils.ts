import axios, { AxiosResponse } from 'axios';
import { readFileSync } from 'fs';
import { sign, verify } from 'jsonwebtoken';

// time in ms from now the mock journal token will be valid for
const MOCK_TOKEN_EXP = 20000;

export interface LoginReturnValue {
    res: AxiosResponse;
    redirectUrl: string;
    decodedToken: object;
}

export const config = JSON.parse(readFileSync(`${__dirname}/config/continuum-adaptor.json`, 'utf8'));

export const login = async (): Promise<LoginReturnValue> => {
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

    const res = await axios.get(`http://localhost:3001/authenticate?token=${mockJournalToken}`);
    const [redirectUrl, returnedToken] = res.request.res.responseUrl.split('?token=');
    const decodedToken = verify(returnedToken, config.authentication_jwt_secret) as object;

    return { res, redirectUrl, decodedToken };
};
