import { readFileSync } from 'fs';
import { EventConfig } from '@libero/event-bus';

interface Config {
    port: number;
    rabbitmq_url: string;
    login_url: string;
    login_return_url: string;
    authentication_jwt_secret: string;
    continuum_jwt_secret: string;
    continuum_api_url: string;
}

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const config: Config = JSON.parse(readFileSync(configPath, 'utf8'));

const serviceConfig = {
    port: config.port,
    auth: {
        // where we redirect once login is finished and successful
        login_return_url: config.login_return_url,
    },
    // jwt token for libero services
    internal_jwt: {
        secret: config.authentication_jwt_secret,
        expires_in: '30m',
    },
    // journal jwt secret is needed for verification when user is redirected from journal login
    journal_jwt: {
        secret: process.env.CONTINUUM_LOGIN_JWT_SECRET as string,
    },
    continuum_api_url: config.continuum_api_url,
    event: {
        url: config.rabbitmq_url,
    } as EventConfig,
};

export default serviceConfig;
