import { Request, Response } from 'express';
import { DomainLogger as logger } from '../logger';
import { decodeToken } from '../jwt';
import { Config } from '../config';

export const GetCurrentUser = (config: Config) => async (request: Request, response: Response): Promise<void> => {
    const authHeader = request.header('Authorization');

    if (!authHeader) {
        logger.warn('noAuthHeader');
        response.status(401).json({ ok: false, msg: 'Invalid token' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        logger.warn('noToken');
        response.status(401).json({ ok: false, msg: 'Invalid token' });
        return;
    }

    const userIdentity = decodeToken(config.authentication_jwt_secret, token);

    if (userIdentity.isEmpty()) {
        logger.warn('invalidToken');
        response.status(401).json({ ok: false, msg: 'Invalid token' });
        return;
    }

    response.status(200);
    response.json(userIdentity.get());
};
