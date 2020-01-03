import { Request, Response } from 'express';
import { DomainLogger as logger } from '../logger';
import { encode, decodeJournalToken } from '../jwt';
import { ProfilesRepo } from '../repo/profiles';
import { v4 } from 'uuid';
import config from '../config';
import { UserIdentity } from '@libero/auth-token';
import { Event, EventBus } from '@libero/event-bus';
import { UserLoggedInPayload, LiberoEventType } from '@libero/event-types';

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

export const Authenticate = async (profilesService: ProfilesRepo, eventBus: EventBus) => (
    req: Request,
    res: Response,
): void | Promise<void> => {
    if (!('token' in req.params)) {
        logger.warn('noTokenProvided');
        res.status(500).json({ ok: false });
        return;
    }

    const token = req.params['token'];
    // Decode the token that's passed to this endpoint from whatever OAuth provider we go with (I'm guessing ORCiD)
    // Somehow resolve that user's identifier/metadata from the profiles service
    // Shove a subset of that information into a JWT
    // Send that back to the client

    // Controller: perform the requests to the various services and fetch the user data

    const {
        auth: { login_return_url },
    } = config;

    const parsedToken = decodeJournalToken(token);

    if (parsedToken.isEmpty()) {
        logger.error('Invalid token');
        res.status(403).json({ ok: false, msg: 'unauthorised' });
        throw new Error();
    }
    const id = parsedToken.get();
    const maybeProfile = await profilesService.getProfileById(id);

    if (maybeProfile.isEmpty()) {
        logger.warn('unauthorized');
        res.status(403).json({ ok: false, msg: 'unauthorised' });
        return;
    }
    const profile = maybeProfile.get();
    logger.info('getProfile', profile);
    // TODO: Calculate user-role
    const emailAddress = profile.emailAddresses.length > 0 ? profile.emailAddresses[0].value : null;

    const identity = {
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

    if (emailAddress) {
        payload.meta = {
            email: emailAddress,
        };
    }

    const outputToken = encode(payload);

    // send audit logged in message
    const auditEvent: Event<UserLoggedInPayload> = {
        id: v4(),
        created: new Date(),
        eventType: LiberoEventType.userLoggedInIdentifier,
        context: {
            source: 'continuum-auth',
        },
        payload: {
            name: profile.name.preferred,
            userId: payload.identity.user_id,
            email: profile.emailAddresses.length > 0 ? profile.emailAddresses[0].value : '',
            result: 'authorized',
            timestamp: new Date(),
        },
    };
    eventBus.publish(auditEvent);

    res.redirect(`${login_return_url}#${outputToken}`);
}
