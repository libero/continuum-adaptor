import { Request, Response, NextFunction } from 'express';
import { Unauthorized } from 'http-errors';
import { decodeToken } from '../jwt';
import { Config } from '../config';

export const GetCurrentUser = (config: Config) => async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void | Response> => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            throw new Unauthorized('Invalid token');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new Unauthorized('Invalid token');
        }

        const userIdentity = decodeToken(config.authentication_jwt_secret, token);

        if (userIdentity.isEmpty()) {
            throw new Unauthorized('Invalid token');
        }

        return res.status(200).json(userIdentity.get());
    } catch (error) {
        return next(error);
    }
};
