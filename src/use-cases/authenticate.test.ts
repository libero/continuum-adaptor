import { Request, Response } from 'express';
import { None, Option } from 'funfix';
import * as flushPromises from 'flush-promises';
import { Authenticate } from './authenticate';
import { verify } from 'jsonwebtoken';
import * as jwt from '../jwt';
import { Config } from '../config';
import { LiberoEventType } from '@libero/event-types';

jest.mock('../logger');
jest.mock('fs', (): object => ({
    readFileSync: (): string => '{}',
}));

const config: Config = {
    port: 3000,
    rabbitmq_url: 'rabbitmq',
    login_url: 'login-url',
    login_return_url: 'login-return',
    authentication_jwt_secret: 'ca-secret',
    continuum_jwt_secret: 'continuum-secret',
    continuum_api_url: 'somewhere',
};

describe('Authenticate Handler', () => {
    let profilesRepoMock;
    let eventBusMock;
    let requestMock;
    let responseMock;
    let decodeJournalTokenMock;

    beforeEach(() => {
        profilesRepoMock = {
            getProfileById: jest.fn(),
        };
        eventBusMock = {
            init: jest.fn(),
            publish: jest.fn(),
            subscribe: jest.fn(),
        };
        requestMock = {
            params: { token: 'token' },
        };
        responseMock = {
            status: jest.fn(),
            json: jest.fn(),
            redirect: jest.fn(),
        };
        decodeJournalTokenMock = jest.spyOn(jwt, 'decodeJournalToken');

        responseMock.status.mockImplementation(() => responseMock);
        profilesRepoMock.getProfileById.mockImplementation(() =>
            Promise.resolve(
                Option.of({
                    id: 'id',
                    orcid: 'orcid',
                    emailAddresses: [{ value: 'foo@example.com' }],
                    name: { preferred: 'bar' },
                }),
            ),
        );
    });

    afterEach(jest.resetAllMocks);

    /**
     * Test cases where there is something wrong with the token
     */
    describe('with invalid token', () => {
        it('should return an error when no token provided', async () => {
            const handler = Authenticate(config, profilesRepoMock, eventBusMock);
            requestMock.params = {};

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(500);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ ok: false });
        });

        it('should throw error with invalid token', async () => {
            decodeJournalTokenMock.mockImplementation(() => None);

            const handler = Authenticate(config, profilesRepoMock, eventBusMock);

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(500);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ ok: false, msg: 'Invalid token' });
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

        it('should return an error when no profile found', async () => {
            const handler = Authenticate(config, profilesRepoMock, eventBusMock);
            profilesRepoMock.getProfileById.mockImplementation(() => Promise.resolve(None));

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(403);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ ok: false, msg: 'unauthorised' });
        });

        it('should redirect to correct url and contain an encoded token', async () => {
            const handler = Authenticate(config, profilesRepoMock, eventBusMock);

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.redirect).toHaveBeenCalledTimes(1);
            const firstArg = responseMock.redirect.mock.calls[0][0];
            const [url, token] = firstArg.split('#');

            expect(url).toBe(returnUrl);

            // decode now
            const decoded = verify(token, config.authentication_jwt_secret) as object;

            const expectedPayload = {
                identity: {
                    external: [
                        {
                            domain: 'elife-profiles',
                            id: 'id',
                        },
                        {
                            domain: 'orcid',
                            id: 'orcid',
                        },
                    ],
                },
                iss: 'continuum-auth',
                meta: {
                    email: 'foo@example.com',
                },
                roles: [
                    {
                        journal: 'elife',
                        kind: 'author',
                    },
                ],
                token_version: '0.1-alpha',
            };

            // iat, exp
            // "user_id": "b555542f-d846-42d7-a6d4-bcfa6529528c",
            // token_id
            expect(typeof decoded['iat']).toBe('number');
            delete decoded['iat'];

            expect(typeof decoded['exp']).toBe('number');
            delete decoded['exp'];

            expect(typeof decoded['identity']['user_id']).toBe('string');
            delete decoded['identity']['user_id'];

            expect(typeof decoded['token_id']).toBe('string');
            delete decoded['token_id'];

            expect(decoded).toStrictEqual(expectedPayload);
        });

        it('should send logged in event for audit', async () => {
            const handler = Authenticate(config, profilesRepoMock, eventBusMock);

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            const auditEvent = eventBusMock.publish.mock.calls[0][0];
            expect(eventBusMock.publish).toHaveBeenCalledTimes(1);
            expect(auditEvent.eventType).toBe(LiberoEventType.userLoggedInIdentifier);
            expect(auditEvent.payload.userId).toHaveLength(36);
            expect(auditEvent.payload.timestamp instanceof Date).toBeTruthy();
            expect(auditEvent.payload.result).toBe('authorized');
        });
    });
});
