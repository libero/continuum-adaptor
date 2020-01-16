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

    constructor(url: string) {
        this.url = url;
    }

    private makePersonUrl(personId: string): string {
        return `${this.url}/${personId}`;
    }

    public async getPersonById(personId: string): Promise<Option<Person>> {
        return Option.of(
            await fetch(this.makePersonUrl(personId))
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
