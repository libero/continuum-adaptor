import * as Knex from 'knex';
import { KnexUserRepository } from './user';

describe('User repository', () => {
    let mockQueryBuilder;
    let mockKnex;

    beforeEach(() => {
        mockQueryBuilder = {
            withSchema: jest.fn(),
            first: jest.fn(),
            from: jest.fn(),
            where: jest.fn(),
            insert: jest.fn(),
            into: jest.fn(),
            select: jest.fn(),
        };
        mockQueryBuilder.withSchema.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.select.mockImplementation(() => mockQueryBuilder);
        mockKnex = (mockQueryBuilder as unknown) as Knex;
    });

    it('should insert a new user and identity if not present', async () => {
        mockQueryBuilder.first.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.from.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.insert.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.where.mockReturnValueOnce(null).mockReturnValueOnce({});
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
        mockQueryBuilder.first.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.from.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.select.mockImplementation(() => mockQueryBuilder);
        mockQueryBuilder.where.mockImplementation(() => ({ userId: '123' }));

        const userRepository = new KnexUserRepository(mockKnex);

        await userRepository.findOrCreateUserWithProfileId('profile');

        expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(0);
        expect(mockQueryBuilder.where.mock.calls[1]).toEqual(['id', '123']);
    });
});
