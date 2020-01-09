import { Option, None } from 'funfix';
import { verify, sign } from 'jsonwebtoken';
import { UserIdentity } from '@libero/auth-token';
import { InfraLogger as logger } from './logger';

export const encode = (secret: string, payload: object, expiresIn: string): string => {
    logger.trace('jwtEncode');
    return sign(payload, secret, { expiresIn, issuer: 'continuum-auth' });
};

export interface JournalAuthToken {
    iss: string;
    iat: number;
    exp: number;
    id: string;
    'new-session': boolean;
}

export const decodeJournalToken = (secret: string, token: string): Option<JournalAuthToken> => {
    try {
        return Option.of(verify(token, secret) as JournalAuthToken);
    } catch (_) {
        logger.warn('invalidJournalJwt');
        return None;
    }
};

export const decodeToken = (secret: string, token: string): Option<UserIdentity> => {
    try {
        return Option.of(verify(token, secret) as UserIdentity);
    } catch (_) {
        logger.warn('invalidJwt');
        return None;
    }
};
