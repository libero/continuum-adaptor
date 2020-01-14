import { Request, Response } from 'express';
import { DomainLogger as logger } from '../logger';
import { encode, decodeJournalToken } from '../jwt';
import { ProfilesRepo } from '../repo/profiles';
import { v4 } from 'uuid';
import { UserIdentity } from '@libero/auth-token';
import { RabbitEventBus } from '@libero/event-bus';
import { UserLoggedInEvent, UserLoggedInPayload } from '@libero/event-types';
import { Config } from '../config';
import { IdentityRepository } from 'domain/types';

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

export const Authenticate = (
    config: Config,
    profilesService: ProfilesRepo,
    userService: IdentityRepository,
    eventBus: RabbitEventBus,
) => async (req: Request, res: Response): Promise<void> => {
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

    const id = parsedToken.get().id;
    const maybeProfile = await profilesService.getProfileById(id);

    if (maybeProfile.isEmpty()) {
        logger.warn('unauthorized');
        res.status(403).json({ ok: false, msg: 'Unauthorised' });
        return;
    }
    const profile = maybeProfile.get();

    const user = await userService.findOrCreateUser(id);

    // TODO: Calculate user-role
    const identity = {
        // we need this to be the libero user id
        // at the moment we just generate any old one because we don't have
        // the peoples service.
        user_id: v4(), // TODO: this needs to be a useful value at some point
        external: [
            {
                id: profile.id,
                domain: 'elife-profiles',
            },
        ],
    };

    if (profile.orcid) {
        identity.external.push({
            id: profile.orcid,
            domain: 'orcid',
        });
    }

    const payload: UserIdentity = {
        token_id: v4(),
        token_version: '0.1-alpha',
        identity,
        roles: [{ journal: 'elife', kind: 'author' }],
        meta: null,
    };

    const hasEmail = 'emailAddresses' in profile && profile.emailAddresses.length > 0;
    const emailAddress = hasEmail ? profile.emailAddresses[0].value : null;

    // We don't care if there is no email
    if (emailAddress) {
        payload.meta = {
            email: emailAddress,
        };
    }

    const encodedPayload = encode(config.authentication_jwt_secret, payload, '30m');

    const eventPayload: UserLoggedInPayload = {
        userId: payload.identity.user_id,
        result: 'authorized',
        timestamp: new Date(),
    };

    // send audit logged in message
    eventBus.publish(new UserLoggedInEvent(eventPayload));

    res.redirect(`${config.login_return_url}#${encodedPayload}`);
};
