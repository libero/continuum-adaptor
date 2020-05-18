import { InfraLogger as logger } from '../logger';
import fetch from 'node-fetch';
import { Option } from 'funfix';
import { checkStatus } from '../utils';

export interface EditorAlias {
    id: string;
    name: string;
    aff: string;
    focuses: string[];
    expertises: string[];
}

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
    isValidRole(role: string): boolean;
    getPersonById(id: string): Promise<Option<Person>>;
    getPeopleByRole(role: string): Promise<EditorAlias[]>;
}

export class PeopleService implements PeopleRepository {
    private url: string;
    private token: string;

    // Taken from journal-cms:
    private static validRoles = [
        'director',
        'early-career',
        'executive',
        'leadership',
        'reviewing-editor',
        'senior-editor',
    ];

    public isValidRole(role: string): boolean {
        return PeopleService.validRoles.indexOf(role) > 1;
    }

    constructor({ url, token }: { url: string; token: string }) {
        this.url = url;
        this.token = token;
    }

    private makePersonUrl(personId: string): string {
        return `${this.url}/${personId}`;
    }

    private makePeopleUrl(role: string, page: number): string {
        const query = `order=asc&page=${page}&per-page=100&type[]=${role}`;
        return `${this.url}?${query}`;
    }

    public async getPersonById(personId: string): Promise<Option<Person>> {
        const url = this.makePersonUrl(personId);
        const args = { headers: {} };

        if (this.token.length > 0) {
            args.headers['Authorization'] = `${this.token}`;
        }
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

    public async getPeopleByRole(role: string): Promise<EditorAlias[]> {
        if (!this.isValidRole(role)) {
            throw new TypeError(`Invalid Role Querying the eLife API: ${role}`);
        }
        logger.debug(`Fetching editors starting from ${this.makePeopleUrl(role, 1)}`);

        let items = [];
        let page = 1;
        let itemsLeft = true;
        do {
            const response = await fetch(this.makePeopleUrl(role, page));
            const jsonResponse = await response.json();
            if (jsonResponse) {
                items = items.concat(jsonResponse.items);
            }
            page += 1;
            itemsLeft = items.length < jsonResponse.total;
        } while (itemsLeft);
        return !items || items.length === 0 ? [] : items.map(this.convertPerson);
    }

    private convertPerson(apiPerson): EditorAlias {
        const { id, name, research = {}, affiliations } = apiPerson;
        const { focuses = [], expertises = [] } = research;

        const affiliationString = affiliations
            ? affiliations.map(a => (a.name ? a.name.join(', ') : undefined)).join(', ')
            : undefined;

        const editor: EditorAlias = {
            id,
            name: name.preferred,
            aff: affiliationString,
            focuses,
            expertises: expertises.map(expertise => expertise.name) || [],
        };

        return editor;
    }
}
