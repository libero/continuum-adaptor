import * as express from 'express';
import { Express, Request, Response } from 'express';
import * as http from 'http';
import * as knex from 'knex';
import errorHandler from './middleware/error-handler';
import { InfraLogger as logger } from './logger';
import { KnexUserRepository } from './repo/user';
import { ProfilesService } from './repo/profiles';
import { PeopleService } from './repo/people';
import { HealthCheck, Authenticate, GetCurrentUser, GetEditors, GetPerson, loginProxy } from './use-cases';
import config from './config';

const token = process.env.ELIFE_API_GATEWAY_SECRET || '';

const init = async (): Promise<http.Server> => {
    logger.info(`Starting service on port ${config.port}`);
    logger.info(`config.login_url: ${config.login_url}`);
    logger.info(`config.login_return_url: ${config.login_return_url}`);
    logger.info(`config.continuum_api_url: ${config.continuum_api_url}`);

    const app: Express = express();
    const knexConnection = knex(config.knex);

    const userRepository = new KnexUserRepository(knexConnection);
    const profileService = new ProfilesService(`${config.continuum_api_url}/profiles`);
    const peopleService = new PeopleService({ url: `${config.continuum_api_url}/people`, token });

    logger.info(`Setting up routes`);
    app.use('/', (req: Request, _res: Response, next) => {
        // Maybe this should be trace level logging
        logger.info(`${req.method} ${req.path}`, {});
        next();
    });

    app.get('/health', HealthCheck());
    app.get('/auth-login', loginProxy(config));
    app.get('/authenticate', Authenticate(config, userRepository));
    app.get('/current-user', GetCurrentUser(config, userRepository, profileService));
    app.get('/editors', GetEditors(config, peopleService));
    app.get('/people/:id', GetPerson(config, peopleService));
    app.use(errorHandler);

    const server = app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
    server.on('close', async () => await knexConnection.destroy());
    return server;
};

const main = async (): Promise<void> => {
    const serverHandle = await init();

    process.on('SIGINT', () => {
        serverHandle.close(() => {
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        serverHandle.close(() => {
            process.exit(0);
        });
    });
};

main();
