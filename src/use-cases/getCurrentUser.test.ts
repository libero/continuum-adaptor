import { Request, Response, NextFunction } from 'express';
import { Unauthorized } from 'http-errors';
import { Config as KnexConfig } from 'knex';
import { Option } from 'funfix';
import * as flushPromises from 'flush-promises';
import * as jwt from '../jwt';
import { UserIdentity } from '@libero/auth-token';
import { Config } from '../config';
import { GetCurrentUser } from './getCurrentUser';
import { ProfilesRepo } from '../repo/profiles';
import { UserRepository, User, Identity } from '../domain/types';

jest.mock('../logger');

const config: Config = {
    port: 3000,
    rabbitmq_url: 'rabbitmq',
    login_url: 'login-url',
    login_return_url: 'login-return',
    authentication_jwt_secret: 'ca-secret',
    continuum_jwt_secret: 'continuum-secret',
    continuum_api_url: 'somewhere',
    knex: {} as KnexConfig,
};

describe('Get Current User Handler', (): void => {
    let requestMock;
    let responseMock;
    let nextFunctionMock;
    let userRepoMock;
    let profilesServiceMock;

    beforeEach((): void => {
        requestMock = {
            header: jest.fn(),
        };
        responseMock = {
            status: jest.fn(),
            json: jest.fn(),
        };
        nextFunctionMock = jest.fn();
        userRepoMock = {
            findUser: jest.fn(),
        };
        profilesServiceMock = {
            getProfileById: jest.fn(),
        };

        responseMock.status.mockImplementation(() => responseMock);
    });

    describe('with invalid token', (): void => {
        it('should return an error with no authorization header', async () => {
            const handler = GetCurrentUser(
                config,
                (userRepoMock as unknown) as UserRepository,
                profilesServiceMock as ProfilesRepo,
            );
            requestMock.headers = {};

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );

            await flushPromises();

            expect(responseMock.status).not.toHaveBeenCalled();
            expect(responseMock.json).not.toHaveBeenCalled();
            expect(nextFunctionMock).toHaveBeenCalledWith(new Unauthorized('Invalid token'));
        });

        it('should return an error with malformed header', async () => {
            const handler = GetCurrentUser(
                config,
                (userRepoMock as unknown) as UserRepository,
                profilesServiceMock as ProfilesRepo,
            );
            requestMock.header.mockImplementation(() => 'BadHeader');

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );
            await flushPromises();

            expect(responseMock.status).not.toHaveBeenCalled();
            expect(responseMock.json).not.toHaveBeenCalled();
            expect(nextFunctionMock).toHaveBeenCalledWith(new Unauthorized('Invalid token'));
        });

        it('should return an error with invalid token provided', async () => {
            const handler = GetCurrentUser(
                config,
                (userRepoMock as unknown) as UserRepository,
                profilesServiceMock as ProfilesRepo,
            );
            requestMock.header.mockImplementation(() => 'Bearer: Invalid Token');

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );
            await flushPromises();

            expect(responseMock.status).not.toHaveBeenCalled();
            expect(responseMock.json).not.toHaveBeenCalled();
            expect(nextFunctionMock).toHaveBeenCalledWith(new Unauthorized('Invalid token'));
        });
    });

    describe('with valid token', (): void => {
        it('should return user info', async () => {
            const decodeTokenMock = jest.spyOn(jwt, 'decodeToken');
            const user = new User();
            user.id = 'id';
            user.identities = [{ type: 'elife', identifier: 'profile_id' } as Identity];
            profilesServiceMock.getProfileById.mockImplementation(() =>
                Promise.resolve(
                    Option.of({
                        id: 'profile_id',
                        orcid: 'orcid',
                        name: {
                            preferred: 'Joe Bloggs',
                            index: 'Bloggs, Joe',
                        },
                        emailAddresses: ['joe@example.com'],
                    }),
                ),
            );
            userRepoMock.findUser.mockImplementation(() => user);

            decodeTokenMock.mockImplementation(() => Option.of(({ sub: 'id' } as unknown) as UserIdentity));

            const handler = GetCurrentUser(
                config,
                (userRepoMock as unknown) as UserRepository,
                profilesServiceMock as ProfilesRepo,
            );
            requestMock.header.mockImplementation(() => 'Bearer: Valid Token');

            const expectedUser = {
                identity: {
                    user_id: 'id',
                    external: [
                        {
                            id: 'profile_id',
                            domain: 'elife-profiles',
                        },
                        {
                            id: 'orcid',
                            domain: 'orcid',
                        },
                    ],
                },
            };

            handler(
                requestMock as Request,
                (responseMock as unknown) as Response,
                (nextFunctionMock as unknown) as NextFunction,
            );
            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(200);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json.mock.calls[0][0]).toMatchObject(expectedUser);
        });
    });
});
