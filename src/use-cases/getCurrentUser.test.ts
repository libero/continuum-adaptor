import { Request, Response } from 'express';
import * as flushPromises from 'flush-promises';
import * as jwt from '../jwt';
import { Option } from 'funfix';
import { UserIdentity } from '@libero/auth-token';
import { Config } from '../config';
import { GetCurrentUser } from './getCurrentUser';

jest.mock('../logger');

const config: Config = {
    port: 3000,
    rabbitmq_url: 'rabbitmq',
    login_url: 'login-url',
    login_return_url: 'login-return',
    authentication_jwt_secret: 'ca-secret',
    continuum_jwt_secret: 'continuum-secret',
    continuum_api_url: 'somewhere',
};

describe('Get Current User Handler', (): void => {
    let requestMock;
    let responseMock;

    beforeEach((): void => {
        requestMock = {
            header: jest.fn(),
        };
        responseMock = {
            status: jest.fn(),
            json: jest.fn(),
        };

        responseMock.status.mockImplementation(() => responseMock);
    });

    describe('with invalid token', (): void => {
        it('should return an error with no authorization header', async () => {
            const handler = GetCurrentUser(config);
            requestMock.headers = {};

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(401);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ ok: false, msg: 'Invalid token' });
        });

        it('should return an error with malformed header', async () => {
            const handler = GetCurrentUser(config);
            requestMock.header.mockImplementation(() => 'BadHeader');

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(401);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ ok: false, msg: 'Invalid token' });
        });

        it('should return an error with invalid token provided', async () => {
            const handler = GetCurrentUser(config);
            requestMock.header.mockImplementation(() => 'Bearer: Invalid Token');

            handler(requestMock as Request, (responseMock as unknown) as Response);

            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(401);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ ok: false, msg: 'Invalid token' });
        });
    });

    describe('with invalid token', (): void => {
        it('should return user info', async () => {
            const decodeTokenMock = jest.spyOn(jwt, 'decodeToken');

            decodeTokenMock.mockImplementation(() => Option.of(({ entity_id: 'id' } as unknown) as UserIdentity));

            const handler = GetCurrentUser(config);
            requestMock.header.mockImplementation(() => 'Bearer: Valid Token');

            handler(requestMock as Request, (responseMock as unknown) as Response);
            await flushPromises();

            expect(responseMock.status).toHaveBeenCalledTimes(1);
            expect(responseMock.status).toHaveBeenCalledWith(200);
            expect(responseMock.json).toHaveBeenCalledTimes(1);
            expect(responseMock.json).toHaveBeenCalledWith({ entity_id: 'id' });
        });
    });
});
