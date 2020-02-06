import * as Knex from 'knex';
import { v4 } from 'uuid';
import { Option, None } from 'funfix';
import { UserRepository, Identity, User } from '../domain/types';

export class KnexUserRepository implements UserRepository {
    public constructor(private readonly knex: Knex<{}, unknown[]>) {}
    private async findIdentity(profileId: string): Promise<Identity> {
        const identity = await this.knex
            .withSchema('xpublegacy')
            .first(
                'user_id as userId',
                'id',
                'created',
                'updated',
                'type',
                'identifier',
                'display_name as displayName',
                'email',
            )
            .from<Identity>('identity')
            .where('identifier', profileId);

        return typeof identity === 'undefined' ? null : identity;
    }

    public async findUser(userId: string): Promise<Option<User>> {
        const row = await this.knex
            .withSchema('xpublegacy')
            .first('id', 'created', 'updated', 'default_identity as defaultIdentity')
            .from<User>('user')
            .where('id', userId);

        if (!row) {
            return None;
        }

        const identities = await this.knex
            .select('id', 'created', 'updated', 'type', 'identifier', 'display_name as displayName', 'email')
            .withSchema('xpublegacy')
            .from<Identity>('identity')
            .where('user_id', userId);

        const user = new User();
        user.id = row.id;
        user.created = row.created;
        user.updated = row.updated;
        user.defaultIdentity = row.defaultIdentity;
        user.identities = identities;

        return Option.of(user);
    }

    private async createUser(): Promise<string> {
        const userIds = await this.knex
            .withSchema('xpublegacy')
            .insert(
                {
                    default_identity: 'elife',
                    id: v4(),
                },
                'id',
            )
            .into('user');

        return userIds[0];
    }

    private async createIdentity(profileId: string, userId: string): Promise<void> {
        return await this.knex
            .withSchema('xpublegacy')
            .insert({
                user_id: userId,
                identifier: profileId,
                type: 'elife',
                id: v4(),
            })
            .into('identity');
    }

    public async findOrCreateUserWithProfileId(profileId: string): Promise<User> {
        const identity = await this.findIdentity(profileId);
        let userId = identity && identity.userId;
        if (identity === null) {
            userId = await this.createUser();
            await this.createIdentity(profileId, userId);
        }

        const user = await this.findUser(userId);

        if (user.isEmpty()) {
            throw new Error('Unable to create User in database');
        }

        return user.get();
    }
}
