import axios from 'axios';
import { RabbitEventBus } from '@libero/event-bus';
import { LiberoEventType } from '@libero/event-types';
import waitForExpect from 'wait-for-expect';
import { login, LoginReturnValue, config } from './utils';

describe('Authenticate', (): void => {
    // happy path
    it('authenticates a user session token', async (): Promise<void> => {
        await login().then(({ res, redirectUrl, decodedToken }: LoginReturnValue) => {
            expect(res.status).toBe(200);
            expect(res.data).toBe('Redirect reached successfully');
            expect(redirectUrl).toBe(config.login_return_url);

            const expectedPayload = {
                iss: 'continuum-auth',
                issuer: 'libero',
            };
            const currentTimestamp = new Date().getTime() / 1000;

            expect(typeof decodedToken['iat']).toBe('number');
            expect(decodedToken['iat']).toBeLessThan(currentTimestamp);

            expect(typeof decodedToken['exp']).toBe('number');
            expect(decodedToken['exp']).toBeGreaterThan(currentTimestamp);

            expect(decodedToken['sub']).toHaveLength(36);
            expect(typeof decodedToken['jti']).toBe('string');
            expect(decodedToken['jti']).toHaveLength(36);

            expect(decodedToken).toMatchObject(expectedPayload);
        });
    });

    it('rejects request when no token passed', async (): Promise<void> => {
        await axios.get('http://localhost:3001/authenticate').catch(({ response }) => {
            expect(response.status).toBe(401);
            expect(response.data).toEqual({ ok: false, msg: 'No token' });
        });
    });

    it('rejects request when invalid token passed', async (): Promise<void> => {
        await axios.get('http://localhost:3001/authenticate/INVALID_TOKEN').catch(({ response }) => {
            expect(response.status).toBe(401);
            expect(response.data).toEqual({ ok: false, msg: 'Invalid token' });
        });
    });

    it('sends the apropriate message to the message bus when user is authenticated', async (done): Promise<void> => {
        jest.setTimeout(25000); // to avoid jest timeout on CI env
        const url = `amqp://localhost`;
        const eventBus = new RabbitEventBus({ url }, [LiberoEventType.userLoggedInIdentifier], 'continuum-auth');
        let payload;
        await eventBus.subscribe(
            LiberoEventType.userLoggedInIdentifier,
            (event): Promise<boolean> => {
                payload = event.payload['result'];
                return Promise.resolve(true);
            },
        );
        await login();

        await waitForExpect(
            async () => {
                expect(payload).toBe('authorized');
                await eventBus.destroy();
                done();
            },
            23000,
            1000,
        );
    });
});
