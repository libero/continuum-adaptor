import { Option } from 'funfix';
import * as jwt from '../jwt';
import { Request, Response, NextFunction } from 'express';
import { Config as KnexConfig } from 'knex';
import * as flushPromises from 'flush-promises';
import { Config } from '../config';
import { PeopleRepository, Person } from '../repo/people';
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

const person = {
    id: 'profile_id',
    name: {
        preferred: 'Joe Bloggs',
        index: 'Bloggs, Joe',
    },
    type: {
        id: 'reviewing-editor',
        label: 'Reviewing Editor',
    },
} as Person;

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
        peopleServiceMock = {
            getPersonById: jest.fn(),
        };
        nextFunctionMock = jest.fn();
        peopleServiceMock.getPersonById.mockImplementation(() => Promise.resolve(Option.of(person)));

        responseMock.status.mockImplementation(() => responseMock);

        handler = GetPerson(config, peopleServiceMock as PeopleRepository);
    });

    it('should call people service correctly', async () => {
        const decodeTokenMock = jest.spyOn(jwt, 'decodeToken');
        decodeTokenMock.mockImplementation(() => Option.of(({ sub: 'id' } as unknown) as jwt.LiberoAuthToken));
        requestMock.header.mockImplementation(() => 'Bearer: Valid Token');
        requestMock.params = { id: 'profile_id' };

        handler(
            requestMock as Request,
            (responseMock as unknown) as Response,
            (nextFunctionMock as unknown) as NextFunction,
        );

        await flushPromises();

        expect(responseMock.status).toHaveBeenCalledWith(200);
        expect(responseMock.json).toHaveBeenCalled();
        expect(responseMock.json.mock.calls[0][0]).toMatchObject(person);
        expect(peopleServiceMock.getPersonById).toHaveBeenCalledTimes(1);
        expect(peopleServiceMock.getPersonById).toHaveBeenCalledWith('profile_id');
    });
});
