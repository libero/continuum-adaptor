import axios from 'axios';
import { Server } from 'http';
import { readFileSync } from 'fs';
import * as express from 'express';
import { sign } from 'jsonwebtoken';
const configPath = `${__dirname}/config/continuum-auth.json`;
const config = JSON.parse(readFileSync(configPath, 'utf8'));

describe('Authenticate', (): void => {
    let server: Server;
    beforeAll(() => {
        const app: express.Express = express();
        app.get('/redirect_destination', (_, resp) => {
            resp.status(200).send('Successful redirect');
        });
        app.get('/profiles/*', (_, resp) => {
            console.log('We hit this correctly.');
            resp.status(200).json({
                id: 'TEST_ID',
                name: {
                    preferred: 'TEST_PREFERRED_NAME',
                    index: 'TEST_INDEX_NAME',
                },
                orcid: '0000-0001-2345-6789',
                emailAddresses: [],
                affiliations: [],
            });
        });
        //TODO: remove magic port number
        server = app.listen(3002, () => console.log('Listening port 3002'));

        // Do we need a health check on this awaited?
    });

    afterAll(() => {
        server.close();
    });

    // happy path
    it('authenticates a user session token', async (): Promise<void> => {
        // TODO: remove magic number for adding exp time to now
        const mockJournalToken = sign(
            {
                iss: 'journal--prod',
                iat: 1567503944,
                exp: new Date().getTime() + 20000,
                id: 'TEST_ID',
                'new-session': true,
            },
            config.continuum_jwt_secret,
        );

        // Remeber response is redirect. We need to catch this correctly for assertions
        await axios
            .get(`http://localhost:3001/authenticate/${mockJournalToken}`)
            .then(res => {
                console.log('RESPONSE: ', res);
            })
            .catch((error: Error) => {
                console.log('ERROR: ', error.stack);
            });
        // unwrap token assert data from profile correct
    });
    // No token

    // Bad journal token
});
