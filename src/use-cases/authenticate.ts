import { Request, Response, NextFunction } from 'express';
import { v4 } from 'uuid';
import { Unauthorized } from 'http-errors';
import { UserRepository } from '../domain/types';
import { Config } from '../config';
import { encode, decodeJournalToken, LiberoAuthToken } from '../jwt';

export const Authenticate = (config: Config, userService: UserRepository) => async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.params.token) {
            throw new Unauthorized('No token');
        }
        const token = req.params['token'];
        // Decode the token that's passed to this endpoint from whatever OAuth provider we go with (I'm guessing ORCiD)
        // Somehow resolve that user's identifier/metadata from the profiles service
        // Shove a subset of that information into a JWT
        // Send that back to the client

        // Controller: perform the requests to the various services and fetch the user data

        const parsedToken = decodeJournalToken(config.continuum_jwt_secret, token);

        if (parsedToken.isEmpty()) {
            throw new Unauthorized('Invalid token');
        }

        const profileId = parsedToken.get().id;
        // Get the user object
        const user = await userService.findOrCreateUserWithProfileId(profileId);

        const payload = {
            sub: user.id,
            issuer: 'libero',
            jti: v4(),
        } as LiberoAuthToken;

        const encodedPayload = encode(config.authentication_jwt_secret, payload, '30m');

        return res.redirect(`${config.login_return_url}#${encodedPayload}`);
    } catch (error) {
        return next(error);
    }
};
