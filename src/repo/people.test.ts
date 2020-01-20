import fetch from 'node-fetch';
import { None } from 'funfix';
import { PeopleService } from './people';

const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');
jest.mock('../logger');

describe('people', () => {
    it('fetchs a person by id', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('{"id": "person-id1"}', { status: 200 })),
        );

        const profile = await new PeopleService('http://people_service_url').getPersonById('person-id1');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('http://people_service_url/person-id1');
        expect(profile.get().id).toEqual('person-id1');
    });

    it('returns none value in case of bad response', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('{}', { status: 400 })),
        );

        const data = await new PeopleService('http://people_service_url').getPersonById('person-id2');
        expect(data).toBe(None);
    });

    it('returns none value in case of none json response', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
            Promise.resolve(new Response('not json', { status: 200 })),
        );

        const data = await new PeopleService('http://people_service_url').getPersonById('person-id3');
        expect(data).toBe(None);
    });
});
