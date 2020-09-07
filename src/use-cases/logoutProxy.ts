import { Request, Response } from 'express';
import { Config } from '../config';

export const logoutProxy = (config: Config) => async (_: Request, res: Response): Promise<void | Response> => {
    return res.redirect(301, config.logout_url);
};
