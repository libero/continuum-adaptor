// Use knex to connect to a database and write stuff to the table
import { UserRepository, Identity, User } from '../domain/types';
import * as Knex from 'knex';

export class KnexUserRepository implements UserRepository {
    public constructor(private readonly knex: Knex<{}, unknown[]>) {}
    private async findIdentity(profileId: string): Promise<Identity> {
        const identity = await this.knex
            .first(
                'user_id as userId',
                'id',
                'created',
                'updated',
                'type',
                'indentifier',
                'display_nname as displayName',
                'email',
            )
            .from<Identity>('identity')
            .where('indentifier', profileId);
        return identity;
    }

    private async findUser(userId: string): Promise<User> {
        return this.knex
            .first('id', 'created', 'updated', 'default_identity as defaultIdentity')
            .from<User>('user')
            .where('id', userId);
    }

    private async createUserAndIdentity(profileId: string): Promise<string> {
        const userIds = await this.knex
            .insert(
                {
                    default_identity: 'elife',
                },
                'id',
            )
            .into('user');
        const userId: string = userIds[0];
        // TODO: ensure unique constraint on userId and type
        await this.knex
            .insert({
                user_id: userId,
                indentifier: profileId,
                type: 'elife',
            })
            .into('identity');
        return userId;
    }

    public async findOrCreateUserWithProfileId(profileId: string): Promise<User> {
        const identity = await this.findIdentity(profileId);
        let userId = identity && identity.userId;
        if (identity === null) {
            userId = await this.createUserAndIdentity(profileId);
        }
        return await this.findUser(userId);
    }
}