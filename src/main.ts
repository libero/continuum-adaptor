import * as express from 'express';
import { Express, Request, Response } from 'express';
import { InfraLogger as logger } from './logger';
import { ProfilesService } from './repo/profiles';
import { HealthCheck, Authenticate } from './use-cases';
import { setupEventBus } from './event-bus';
import config from './config';
import { EventConfig } from '@libero/event-bus';

const init = async (): Promise<void> => {
    logger.info('Starting service');
    // Start the application
    const app: Express = express();

    // Setup connections to the databases/message queues etc.
    const profilesConnector = new ProfilesService(`${config.continuum_api_url}/profiles`);

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
    app.get('/authenticate/:token?', Authenticate(config, profilesConnector, eventBus));

    app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
};

init();
