import { Request, Response } from 'express';
import { DomainLogger as logger } from '../logger';
import { encode, decodeJournalToken } from '../jwt';
// import { ProfilesRepo } from '../repo/profiles'; // TODO: is this needed?
import { v4 } from 'uuid';
// import { UserIdentity } from '@libero/auth-token'; // TODO: is this needed?
import { RabbitEventBus } from '@libero/event-bus';
import { UserLoggedInEvent, UserLoggedInPayload } from '@libero/event-types';
import { Config } from '../config';
import { UserRepository } from 'domain/types';

// This is the endpoint that does the actual token exchange/user lookup and signing the output token
// And yeah, I know the controller/usecase code shouldn't be mixed but idec, we can refactor it at some point
// The tokens will take the following shape:
// const example_token = {
//   iss: "journal--prod",
//   iat: 1567503944,
//   exp: 1567504004,
//   id: "jfrdocq8",
//   "new-session": true
// };

export const Authenticate = (config: Config, userService: UserRepository, eventBus: RabbitEventBus) => async (
    req: Request,
    res: Response,
): Promise<void> => {
    if (!req.params.token) {
        logger.warn('noTokenProvided');
        res.status(500).json({ ok: false, msg: 'No token' });
        return;
    }
    const token = req.params['token'];
    // Decode the token that's passed to this endpoint from whatever OAuth provider we go with (I'm guessing ORCiD)
    // Somehow resolve that user's identifier/metadata from the profiles service
    // Shove a subset of that information into a JWT
    // Send that back to the client

    // Controller: perform the requests to the various services and fetch the user data

    const parsedToken = decodeJournalToken(config.continuum_jwt_secret, token);

    if (parsedToken.isEmpty()) {
        logger.warn('Invalid token');
        res.status(500).json({ ok: false, msg: 'Invalid token' });
        return;
    }

    const profileId = parsedToken.get().id;
    // Get the user object
    const user = await userService.findOrCreateUserWithProfileId(profileId);

    const payload = {
        sub: user.id,
        issuer: 'libero',
        jti: v4(),
    };

    const encodedPayload = encode(config.authentication_jwt_secret, payload, '30m');

    const eventPayload: UserLoggedInPayload = {
        userId: user.id,
        result: 'authorized',
        timestamp: new Date(),
    };

    // send audit logged in message
    eventBus.publish(new UserLoggedInEvent(eventPayload));

    res.redirect(`${config.login_return_url}#${encodedPayload}`);
};
