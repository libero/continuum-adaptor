import { Option } from 'funfix';
import * as jwt from '../jwt';
import { Request, Response, NextFunction } from 'express';
// import { Unauthorized, NotFound } from 'http-errors';
import { Config as KnexConfig } from 'knex';
import * as flushPromises from 'flush-promises';
import { Config } from '../config';
import { PeopleRepository } from '../repo/people';
import { GetPerson } from './getPerson';

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

describe('Get Editors', (): void => {
    let requestMock;
    let responseMock;
    let nextFunctionMock;
    let peopleServiceMock;
    let handler;

    beforeEach((): void => {
        requestMock = {
            header: jest.fn(),
        };
        responseMock = {
            status: jest.fn(),
            json: jest.fn(),
        };
        nextFunctionMock = jest.fn();
        peopleServiceMock = {
            getPersonById: jest.fn(),
        };

        responseMock.status.mockImplementation(() => responseMock);

        handler = GetPerson(config, peopleServiceMock as PeopleRepository);
    });

    it('should return with valid role', async () => {
        const decodeTokenMock = jest.spyOn(jwt, 'decodeToken');
        decodeTokenMock.mockImplementation(() => Option.of(({ sub: 'id' } as unknown) as jwt.LiberoAuthToken));
        requestMock.header.mockImplementation(() => 'Bearer: Valid Token');
        requestMock.params = { id: 'abc' };

        handler(
            requestMock as Request,
            (responseMock as unknown) as Response,
            (nextFunctionMock as unknown) as NextFunction,
        );

        await flushPromises();

        expect(responseMock.status).toHaveBeenCalledWith(200);
        expect(responseMock.json).toHaveBeenCalled();
        expect(peopleServiceMock.getPersonById).toHaveBeenCalledTimes(1);
        expect(peopleServiceMock.getPersonById).toHaveBeenCalledWith('abc');
    });
});
