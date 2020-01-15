import * as Knex from 'knex';
import { KnexUserRepository } from './user';

describe('User repository', () => {
    it('should insert a new user and identity if not present', async () => {
        const mockBLAH = {
            first: jest.fn(),
            from: jest.fn(),
            where: jest.fn(),
            insert: jest.fn(),
            into: jest.fn(),
        };
        const mockKnex = (mockBLAH as unknown) as Knex;

        mockBLAH.first.mockImplementation(() => mockBLAH);
        mockBLAH.from.mockImplementation(() => mockBLAH);
        mockBLAH.insert.mockImplementation(() => mockBLAH);
        mockBLAH.where.mockImplementation(() => null);
        mockBLAH.into.mockImplementationOnce(() => ['123']);

        const userRepository = new KnexUserRepository(mockKnex);

        await userRepository.findOrCreateUserWithProfileId('profile');

        expect(mockBLAH.insert.mock.calls[0]).toEqual([{ default_identity: 'elife' }, 'id']);
        expect(mockBLAH.into.mock.calls[0]).toEqual(['user']);
        expect(mockBLAH.into.mock.calls[1]).toEqual(['identity']);
        expect(mockBLAH.insert).toHaveBeenCalledTimes(2);
    });

    it('should retrieve a user if present', async () => {
        const mockBLAH = {
            first: jest.fn(),
            from: jest.fn(),
            where: jest.fn(),
            insert: jest.fn(),
            into: jest.fn(),
        };
        mockBLAH.first.mockImplementation(() => mockBLAH);
        mockBLAH.from.mockImplementation(() => mockBLAH);
        mockBLAH.where.mockImplementation(() => ({ userId: '123' }));

        const mockKnex = (mockBLAH as unknown) as Knex;
        const userRepository = new KnexUserRepository(mockKnex);

        await userRepository.findOrCreateUserWithProfileId('profile');

        expect(mockBLAH.insert).toHaveBeenCalledTimes(0);
        expect(mockBLAH.where.mock.calls[1]).toEqual(['id', '123']);
    });
});
