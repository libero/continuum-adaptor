export interface User {
    id: string;
    created: Date;
    updated: Date;
    defaultIdentity: string;
}

export interface Identity {
    id: string;
    userId: string;
    created: Date;
    updated: Date;
    type: string;
    indentifier: string;
    displayName: string;
    email: string;
}

export interface IdentityRepository {
    findOrCreateUser(profileId: string): Promise<User>;
}
