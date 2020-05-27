import { Config as KnexConfig } from 'knex';

export interface Config {
    port: number;
    login_url: string;
    login_return_url: string;
    authentication_jwt_secret: string;
    continuum_jwt_secret: string;
    continuum_api_url: string;
    knex: KnexConfig;
}

const appConfig: Config = {
    port: Number(process.env.PORT),
    login_url: process.env.LOGIN_URL || '',
    login_return_url: process.env.LOGIN_RETURN_URL || '',
    authentication_jwt_secret: process.env.AUTHENTICATION_JWT_SECRET || '',
    continuum_jwt_secret: process.env.CONTINUUM_JWT_SECRET || '',
    continuum_api_url: process.env.CONTINUUM_API_URL || '',
    knex: {
        client: 'pg',
        connection: {
            host: process.env.DATABASE_HOST,
            database: process.env.DATABASE_NAME,
            password: process.env.DATABASE_PASSWORD,
            user: process.env.DATABASE_USER,
            port: Number(process.env.DATABASE_PORT),
        },
    },
};

export default appConfig;
