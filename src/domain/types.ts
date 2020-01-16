export class User {
    id: string;
    created: Date;
    updated: Date;
    defaultIdentity: string; // type default elife
    identities: Array<Identity>;

    public getIdentityByType(type: string): Identity | null {
        return this.identities.find(identity => identity.type === type) || null;
    }
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
    findUser(userId: string): Promise<User>;
    findOrCreateUserWithProfileId(profileId: string): Promise<User>;
}
