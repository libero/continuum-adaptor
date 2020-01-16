import { Request } from 'express';

export interface User {
    id: string;
    created: Date;
    updated: Date;
    defaultIdentity: string; // type default elife
}

// User can have many identities
export interface Identity {
    id: string;
    userId: string;
    created: Date;
    updated: Date;
    type: string;
    identifier: string; // profile ID
    displayName: string;
    email: string;
}

export interface UserRepository {
    findOrCreateUserWithProfileId(profileId: string): Promise<User>;
}

export type CustomRequest = Request & {
    requestTag: string;
};
