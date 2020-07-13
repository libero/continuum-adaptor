import { Request, Response, NextFunction } from 'express';
import { Unauthorized } from 'http-errors';
import { None, Option } from 'funfix';
import * as flushPromises from 'flush-promises';
import { Authenticate } from './authenticate';
import { verify } from 'jsonwebtoken';
import * as jwt from '../jwt';
import { Config } from '../config';
import { Config as KnexConfig } from 'knex';

jest.mock('../logger');
jest.mock('fs', (): object => ({
    readFileSync: (): string => '{}',
}));

const config: Config = {
    port: 3000,
    login_url: 'login-url',
    login_return_url: 'login-return',
    authentication_jwt_secret: 'ca-secret',
    continuum_jwt_secret: 'continuum-secret',
    continuum_api_url: 'somewhere',
    knex: {} as KnexConfig,
};

describe('Authenticate Handler', () => {
    let userRepoMock;
    let requestMock;
    let responseMock;
    let nextFunctionMock;
    let decodeJournalTokenMock;

    beforeEach(() => {
        userRepoMock = {
            findOrCreateUserWithProfileId: jest.fn(),
        };
        requestMock = {
            query: { token: 'token' },
        };
        responseMock = {
            status: jest.fn(),
            json: jest.fn(),
            redirect: jest.fn(),
        };
        nextFunctionMock = jest.fn();
        decodeJournalTokenMock = jest.spyOn(jwt, 'decodeJournalToken');

        responseMock.status.mockImplementation(() => responseMock);
        userRepoMock.findOrCreateUserWithProfileId.mockImplementation(() =>
            Promise.resolve({
                id: 'b555542f-d846-42d7-a6d4-bcfa6529528c',
            }),
        );
    });

    afterEach(jest.resetAllMocks);

    /**
     * Test cases where there is something wrong with the token
     */
    describe('with invalid token', () => {
        it('should return an error when no token provided', async () => {
            const handler = Authenticate(config, userRepoMock);
            requestMock.query = {};

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );

            await flushPromises();

            expect(nextFunctionMock).toHaveBeenCalledTimes(1);
            expect(responseMock.status).not.toHaveBeenCalled();
            expect(nextFunctionMock).toHaveBeenCalledWith(new Unauthorized('No token'));
        });

        it('should throw error with invalid token', async () => {
            decodeJournalTokenMock.mockImplementation(() => None);

            const handler = Authenticate(config, userRepoMock);

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );

            await flushPromises();

            expect(nextFunctionMock).toHaveBeenCalledTimes(1);
            expect(responseMock.status).not.toHaveBeenCalled();
            expect(nextFunctionMock).toHaveBeenCalledWith(new Unauthorized('Invalid token'));
        });
    });

    /**
     * Test cases where we have a valid token
     */
    describe('with valid token', () => {
        const returnUrl = 'http://login_return_url';

        beforeEach(() => {
            config.login_return_url = returnUrl;

            decodeJournalTokenMock.mockImplementation(() => Option.of({ id: 'id' } as jwt.JournalAuthToken));
        });

        it('should redirect to correct url and contain an encoded token', async () => {
            const handler = Authenticate(config, userRepoMock);

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );

            await flushPromises();

            expect(responseMock.redirect).toHaveBeenCalledTimes(1);
            const firstArg = responseMock.redirect.mock.calls[0][0];
            const [url, token] = firstArg.split('?token=');

            expect(url).toBe(returnUrl);

            // decode now
            const decoded = verify(token, config.authentication_jwt_secret) as object;

            const expectedPayload = {
                iss: 'continuum-adaptor',
                sub: 'b555542f-d846-42d7-a6d4-bcfa6529528c',
                issuer: 'libero',
            };
            const currentTimestamp = new Date().getTime() / 1000;

            expect(typeof decoded['iat']).toBe('number');
            expect(decoded['iat']).toBeLessThan(currentTimestamp);

            expect(typeof decoded['exp']).toBe('number');
            expect(decoded['exp']).toBeGreaterThan(currentTimestamp);

            expect(typeof decoded['sub']).toBe('string');
            expect(typeof decoded['jti']).toBe('string');
            expect(decoded['jti']).toHaveLength(36);

            expect(decoded).toMatchObject(expectedPayload);
        });
    });
});
