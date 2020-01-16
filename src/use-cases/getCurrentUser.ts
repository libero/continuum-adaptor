import { Request, Response, NextFunction } from 'express';
import { Unauthorized } from 'http-errors';
import { v4 } from 'uuid';
import { UserIdentity } from '@libero/auth-token';
import { decodeToken } from '../jwt';
import { Config } from '../config';
import { ProfilesRepo } from '../repo/profiles';
import { PeopleRepository } from '../repo/people';
import { UserRepository } from 'domain/types';

// @todo: put this somewhere else
interface AuthToken {
    sub: string;
    issuer: string;
    jti: string;
}

export const GetCurrentUser = (
    config: Config,
    userRepo: UserRepository,
    profilesRepo: ProfilesRepo,
    peopleRepo: PeopleRepository,
) => async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            throw new Unauthorized('Invalid token');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new Unauthorized('Invalid token');
        }

        const decodedToken = decodeToken(config.authentication_jwt_secret, token);

        if (decodedToken.isEmpty()) {
            throw new Unauthorized('Invalid token');
        }

        const userId = ((decodedToken.get() as unknown) as AuthToken).sub;
        const user = await userRepo.findUser(userId);

        if (!user) {
            throw new Unauthorized('User not found');
        }

        const identity = user.getIdentityByType('elife');

        if (!identity) {
            throw new Unauthorized('eLife identity not found');
        }

        const maybeProfile = await profilesRepo.getProfileById(identity.identifier);

        if (maybeProfile.isEmpty()) {
            throw new Unauthorized('eLife profile not found');
        }

        const maybePerson = await peopleRepo.getPersonById(identity.identifier);

        if (maybePerson.isEmpty()) {
            throw new Unauthorized('No roles found');
        }

        const profile = maybeProfile.get();
        const payload: UserIdentity = {
            token_id: v4(),
            token_version: '0.1-alpha',
            identity: {
                user_id: userId,
                external: [
                    {
                        id: profile.id,
                        domain: 'elife-profiles',
                    },
                ],
            },
            roles: [{ journal: 'elife', kind: 'author' }],
            meta: null,
        };

        if (profile.orcid) {
            payload.identity.external.push({
                id: profile.orcid,
                domain: 'orcid',
            });
        }

        const hasEmail = 'emailAddresses' in profile && profile.emailAddresses.length > 0;
        const emailAddress = hasEmail ? profile.emailAddresses[0].value : null;

        // We don't care if there is no email
        if (emailAddress) {
            payload.meta = {
                email: emailAddress,
            };
        }

        return res.status(200).json(payload);
    } catch (error) {
        return next(error);
    }
};
