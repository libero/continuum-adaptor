import { InfraLogger as logger } from '../logger';
import fetch from 'node-fetch';
import { Option } from 'funfix';
import { checkStatus } from '../utils';

export interface Person {
    id: string;
    type: {
        id: string;
        label: string;
    };
    name: {
        preferred: string;
        index: string;
    };
}

export interface PeopleRepository {
    getPersonById(id: string): Promise<Option<Person>>;
}

export class PeopleService implements PeopleRepository {
    private url: string;
    private token: string;

    constructor({ url, token }: { url: string; token: string }) {
        this.url = url;
        this.token = token;
    }

    private makePersonUrl(personId: string): string {
        return `${this.url}/${personId}`;
    }

    public async getPersonById(personId: string): Promise<Option<Person>> {
        const url = this.makePersonUrl(personId);
        const args = { headers: {} };

        if (this.token.length > 0) {
            args.headers['Authorization'] = `${this.token}`;
        }
        console.log(this.token);
        return Option.of(
            await fetch(url, args)
                .then(checkStatus)
                .then(queryResponse => {
                    logger.trace('lookupPersonOk', { personId });
                    return queryResponse.json();
                })
                .catch(e => {
                    logger.debug('lookupPersonError', { personId, e });
                    return undefined;
                }),
        );
    }
}
