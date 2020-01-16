import * as Knex from 'knex';
import { KnexUserRepository } from './user';

describe('User repository', () => {
    it('should insert a new user and identity if not present', async () => {
        const mockQueryBuilder = {
            withSchema: jest.fn(),
            first: jest.fn(),
            from: jest.fn(),
            where: jest.fn(),
            insert: jest.fn(),
            into: jest.fn(),
        };
        const mockKnex = (mockQueryBuilder as unknown) as Knex;

        mockQueryBuilder.withSchema.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.first.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.from.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.insert.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.where.mockImplementation(() => null);
        mockQueryBuilder.into.mockImplementationOnce(() => ['123']);

        const userRepository = new KnexUserRepository(mockKnex);

        await userRepository.findOrCreateUserWithProfileId('profile');

        expect(mockQueryBuilder.insert.mock.calls[0][0].default_identity).toEqual('elife');
        expect(mockQueryBuilder.insert.mock.calls[0][0].id).toHaveLength(36);
        expect(mockQueryBuilder.into.mock.calls[0]).toEqual(['user']);
        expect(mockQueryBuilder.into.mock.calls[1]).toEqual(['identity']);
        expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(2);
    });

    it('should retrieve a user if present', async () => {
        const mockQueryBuilder = {
            withSchema: jest.fn(),
            first: jest.fn(),
            from: jest.fn(),
            where: jest.fn(),
            insert: jest.fn(),
            into: jest.fn(),
            select: jest.fn(),
        };
        mockQueryBuilder.withSchema.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.first.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.from.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.select.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.where.mockImplementation(() => ({ userId: '123' }));

        const mockKnex = (mockQueryBuilder as unknown) as Knex;
        const userRepository = new KnexUserRepository(mockKnex);

        await userRepository.findOrCreateUserWithProfileId('profile');

        expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(0);
        expect(mockQueryBuilder.where.mock.calls[1]).toEqual(['id', '123']);
    });
});
