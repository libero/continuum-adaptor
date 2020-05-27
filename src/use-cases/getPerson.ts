import { Request, Response, NextFunction } from 'express';
import { Unauthorized } from 'http-errors';
import { Config } from '../config';
import { PeopleRepository } from '../repo/people';
import { DomainLogger } from '../logger';
import { decodeToken, LiberoAuthToken } from '../jwt';

export const GetPerson = (config: Config, peopleRepo: PeopleRepository) => async (
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

        const payload = await peopleRepo.getPersonById(req.params.id);

        return res.status(200).json(payload.value);
    } catch (error) {
        DomainLogger.info(error.stack);
        return next(error);
    }
};
