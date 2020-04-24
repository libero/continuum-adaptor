import { Request, Response, NextFunction } from 'express';
import { Unauthorized } from 'http-errors';
import { decodeToken, LiberoAuthToken } from '../jwt';
import { Config } from '../config';
import { ProfilesRepo } from '../repo/profiles';
import { PeopleRepository } from '../repo/people';
import { UserRepository } from '../domain/types';
import { DomainLogger } from '../logger';

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

        const maybeDecodedToken = decodeToken(config.authentication_jwt_secret, token);

        if (maybeDecodedToken.isEmpty()) {
            throw new Unauthorized('Invalid token');
        }

        const userId = (maybeDecodedToken.get() as LiberoAuthToken).sub;

        if (!userId) {
            throw new Unauthorized('Invalid token');
        }

        const maybeUser = await userRepo.findUser(userId);

        if (maybeUser.isEmpty()) {
            throw new Unauthorized('User not found');
        }

        const identity = maybeUser.get().getIdentityByType('elife');

        if (!identity) {
            throw new Unauthorized('eLife identity not found');
        }

        const maybeProfile = await profilesRepo.getProfileById(identity.identifier);

        if (maybeProfile.isEmpty()) {
            throw new Unauthorized('eLife profile not found');
        }

        const maybePerson = await peopleRepo.getPersonById(identity.identifier);

        // if no entry is found, set the role to user
        let role = 'user';
        let name = '';
        let email = '';
        let aff = '';

        if (!maybePerson.isEmpty()) {
            role = maybePerson.get().type.id;
        }
        if (!maybeProfile.isEmpty()) {
            const profile = maybeProfile.get();
            name = profile.name.preferred;

            // email and affiliations may not be returned if there is no API token
            if (profile.emailAddresses) {
                email = profile.emailAddresses[0]?.value;
            }

            if (profile.affiliations) {
                aff = profile.affiliations[0]?.value?.name[0];
            }
        }

        const payload = {
            id: userId,
            name,
            email,
            aff,
            role,
        };
        return res.status(200).json(payload);
    } catch (error) {
        DomainLogger.info(error.stack);
        return next(error);
    }
};
