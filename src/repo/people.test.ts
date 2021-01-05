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
    describe('getPersonById', () => {
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

            const data = await new PeopleService({ url: 'http://people_service_url', token }).getPersonById(
                'person-id2',
            );
            expect(data).toBe(None);
        });

        it('returns none value in case of none json response', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
                Promise.resolve(new Response('not json', { status: 200 })),
            );
            expect(fetch).toHaveBeenCalledTimes(0);

            const data = await new PeopleService({ url: 'http://people_service_url', token }).getPersonById(
                'person-id3',
            );
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
    const person1 =
        '{"id": "person-id1", "name": { "preferred": "person1" }, "affiliations": [{"name" : ["a"]}, {"name" : ["b"]}, {"name" : ["c"]}], "research" :{"focuses" : ["p1f1", "p1f2"], "expertises": [{ "name": "e1"}, { "name": "e2"}]}}';
    const person2 = '{"id": "person-id2", "name": { "preferred": "person2" }}';
    const person3 = '{"id": "person-id3", "name": { "preferred": "person3" }}';

    describe('getPeopleByRole', () => {
        it('fetches a people with role', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
                Promise.resolve(new Response(`{ "items": [${person1}, ${person2}, ${person3}]}`, { status: 200 })),
            );
            expect(fetch).toHaveBeenCalledTimes(0);

            const people = await new PeopleService({ url: 'http://people_service_url/people', token }).getPeopleByRole(
                'reviewing-editor',
            );
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(
                'http://people_service_url/people?order=asc&page=1&per-page=100&type[]=reviewing-editor',
            );
            expect(people).toHaveLength(3);
            expect(people[0]).toHaveProperty('id');
            expect(people[0]).toHaveProperty('name');
            expect(people[0]).toHaveProperty('aff');
            expect(people[0]).toHaveProperty('focuses');
            expect(people[0]).toHaveProperty('expertises');

            expect(people[0].name).toBe('person1');
            expect(people[1].name).toBe('person2');
            expect(people[2].name).toBe('person3');
        });

        it('correctly re-maps properties', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
                Promise.resolve(new Response(`{ "items": [${person1}]}`, { status: 200 })),
            );
            expect(fetch).toHaveBeenCalledTimes(0);

            const people = await new PeopleService({ url: 'http://people_service_url/people', token }).getPeopleByRole(
                'reviewing-editor',
            );
            expect(people).toHaveLength(1);

            expect(people[0].id).toBe('person-id1');
            expect(people[0].name).toBe('person1');
            expect(people[0].aff).toBe('a, b, c');
            expect(people[0].focuses).toEqual(['p1f1', 'p1f2']);
            expect(people[0].expertises).toEqual(['e1', 'e2']);
        });

        it('correctly paginates', async () => {
            const p1 = person1 + ',';
            const response = p1.repeat(99) + person1;
            (fetch as jest.MockedFunction<typeof fetch>)
                .mockReturnValueOnce(
                    Promise.resolve(new Response(`{ "items": [${response}], "total": 101}`, { status: 200 })),
                )
                .mockReturnValueOnce(Promise.resolve(new Response(`{ "items": [${person1}]}`, { status: 200 })));
            expect(fetch).toHaveBeenCalledTimes(0);

            const people = await new PeopleService({ url: 'http://people_service_url/people', token }).getPeopleByRole(
                'reviewing-editor',
            );
            // console.log(fetch);
            expect(people).toHaveLength(101);

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenCalledWith(
                'http://people_service_url/people?order=asc&page=1&per-page=100&type[]=reviewing-editor',
            );
            expect(fetch).toHaveBeenLastCalledWith(
                'http://people_service_url/people?order=asc&page=2&per-page=100&type[]=reviewing-editor',
            );
        });
    });
});
