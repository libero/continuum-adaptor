import fetch from 'node-fetch';
import { None } from 'funfix';
import { PeopleService } from './people';

const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');
jest.mock('../logger');

const token = '';

describe('people', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('fetches a person by id', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('{"id": "person-id1"}', { status: 200 })),
        );
        expect(fetch).toHaveBeenCalledTimes(0);

        const profile = await new PeopleService({ url: 'http://people_service_url', token }).getPersonById(
            'person-id1',
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('http://people_service_url/person-id1', { headers: {} });
        expect(profile.get().id).toEqual('person-id1');
    });

    it('returns none value in case of bad response', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('{}', { status: 400 })),
        );
        expect(fetch).toHaveBeenCalledTimes(0);

        const data = await new PeopleService({ url: 'http://people_service_url', token }).getPersonById('person-id2');
        expect(data).toBe(None);
    });

    it('returns none value in case of none json response', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('not json', { status: 200 })),
        );
        expect(fetch).toHaveBeenCalledTimes(0);

        const data = await new PeopleService({ url: 'http://people_service_url', token }).getPersonById('person-id3');
        expect(data).toBe(None);
    });

    it('sends an API token if one is supplied', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('{"id": "secret-person-id1"}', { status: 200 })),
        );
        expect(fetch).toHaveBeenCalledTimes(0);

        const profile = await new PeopleService({
            url: 'http://people_service_url',
            token: 'secret-token',
        }).getPersonById('person-id1');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('http://people_service_url/person-id1', {
            headers: { Authorization: 'secret-token' },
        });
        expect(profile.get().id).toEqual('secret-person-id1');
    });
});
