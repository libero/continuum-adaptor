import { readFileSync } from 'fs';
import { Config as KnexConfig } from 'knex';

export interface Config {
    port: number;
    rabbitmq_url: string;
    login_url: string;
    login_return_url: string;
    authentication_jwt_secret: string;
    continuum_jwt_secret: string;
    continuum_api_url: string;
    knex: KnexConfig;
}

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const thisConfig: Config = JSON.parse(readFileSync(configPath, 'utf8'));
thisConfig.continuum_jwt_secret = process.env.CONTINUUM_LOGIN_JWT_SECRET
    ? (process.env.CONTINUUM_LOGIN_JWT_SECRET as string)
    : thisConfig.continuum_jwt_secret;

export default thisConfig;
