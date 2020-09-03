import { Request, Response } from 'express';
import { logoutProxy } from './logoutProxy';
import { Config } from '../config';

describe('LogoutProxy', () => {
    it('redirects with a 301 status', () => {
        const mockConfig = ({ logout_url: 'testUrl' } as unknown) as Config;
        const mockRedirect = jest.fn();
        logoutProxy(mockConfig)({} as Request, ({ redirect: mockRedirect } as unknown) as Response);
        expect(mockRedirect).toBeCalledWith(301, 'testUrl');
    });
});
