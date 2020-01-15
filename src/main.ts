import * as express from 'express';
import { Express, Request, Response } from 'express';
import { EventConfig } from '@libero/event-bus';
import { InfraLogger as logger } from './logger';
import { KnexUserRepository } from './repo/user';
import { HealthCheck, Authenticate, GetCurrentUser } from './use-cases';
import { setupEventBus } from './event-bus';
import config from './config';
import * as knex from 'knex';

const init = async (): Promise<void> => {
    logger.info('Starting service');
    // Start the application
    const app: Express = express();
    const knexConnection = knex(config.knex);

    // Setup connections to the databases/message queues etc.
    const userRepository = new KnexUserRepository(knexConnection);

    // setup event bus
    const eventBus = await setupEventBus({ url: config.rabbitmq_url } as EventConfig);
    logger.info('started event bus');

    // Setup routes
    app.use('/', (req: Request, _res: Response, next) => {
        // Maybe this should be trace level logging
        logger.info(`${req.method} ${req.path}`, {});
        next();
    });

    // This is how we do dependency injection at the moment
    app.get('/health', HealthCheck());
    app.get('/authenticate/:token?', Authenticate(config, userRepository, eventBus));
    app.get('/current-user', GetCurrentUser(config));

    const server = app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
    server.on('close', async () => await knexConnection.destroy());
};

init();
