import { Request, Response } from 'express';
import { loginProxy } from './loginProxy';
import { Config } from '../config';

describe('LoginProxy', () => {
    it('redirects with a 301 status', () => {
        const mockConfig = ({ login_url: 'testUrl' } as unknown) as Config;
        const mockRedirect = jest.fn();
        loginProxy(mockConfig)({} as Request, ({ redirect: mockRedirect } as unknown) as Response);
        expect(mockRedirect).toBeCalledWith(301, 'testUrl');
    });
});
