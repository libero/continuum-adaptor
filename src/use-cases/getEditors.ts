import { Request, Response, NextFunction } from 'express';
import { Unauthorized, NotFound } from 'http-errors';
import { decodeToken, LiberoAuthToken } from '../jwt';
import { Config } from '../config';
import { PeopleRepository } from '../repo/people';
import { DomainLogger } from '../logger';

export const GetEditors = (config: Config, peopleRepo: PeopleRepository) => async (
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

        const maybeDecodedToken = decodeToken(config.authentication_jwt_secret, token);

        if (maybeDecodedToken.isEmpty()) {
            throw new Unauthorized('Invalid token');
        }

        const userId = (maybeDecodedToken.get() as LiberoAuthToken).sub;

        if (!userId) {
            throw new Unauthorized('Invalid token');
        }

        const role = req.query.role.toString();
        if (!peopleRepo.isValidRole(role)) {
            throw new NotFound(`Invalid role ${role}`);
        }
        const payload = await peopleRepo.getPeopleByRole(role);
        DomainLogger.log(`Got ${payload.length} items`);
        return res.status(200).json(payload);
    } catch (error) {
        DomainLogger.info(error.stack);
        return next(error);
    }
};
