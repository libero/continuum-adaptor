import { verify } from 'jsonwebtoken';
import { decodeJournalToken } from './jwt';
import { None } from 'funfix';

jest.mock('jsonwebtoken');
jest.mock('./logger');

describe('jwt', () => {
    describe('decodeJournalToken', () => {
        const secret = 'secret';
        it('returns JournalAuthToken if token verified', () => {
            (verify as jest.Mock).mockReturnValueOnce({
                iss: 'iss',
                iat: 1,
                exp: 1,
                id: 'id',
                'new-session': true,
            });
            expect(decodeJournalToken(secret, 'token').get()).toEqual({
                iss: 'iss',
                iat: 1,
                exp: 1,
                id: 'id',
                'new-session': true,
            });
            expect(verify).toHaveBeenCalledTimes(1);
            expect(verify).toHaveBeenCalledWith('token', 'secret');
        });

        it('returns None if token not verified', () => {
            (verify as jest.Mock).mockImplementation(() => {
                throw new Error('not verified');
            });
            expect(decodeJournalToken(secret, 'token')).toBe(None);
            expect(verify).toHaveBeenCalledWith('token', 'secret');
        });
    });
});
