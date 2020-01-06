import { readFileSync } from 'fs';

export interface Config {
    port: number;
    rabbitmq_url: string;
    login_url: string;
    login_return_url: string;
    authentication_jwt_secret: string;
    continuum_jwt_secret: string;
    continuum_api_url: string;
}

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const thisConfig: Config = JSON.parse(readFileSync(configPath, 'utf8'));
thisConfig.continuum_jwt_secret = process.env.CONTINUUM_LOGIN_JWT_SECRET as string;

export default thisConfig;
