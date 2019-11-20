import { EventConfig } from '@libero/event-bus';

const eventConfig: EventConfig = {
    url: process.env.RABBITMQ_URL as string,
};

// This file will be responsible for loading the config from wherever it'll come from
const config = {
    auth: {
        // Where the /login route sends you - a.k.a the identity server
        login_redirect_url: `${process.env.CONTINUUM_LOGIN_URL}`,
        // App entry point i.e. the resource server that needs authentication
        authenticated_redirect_url: `${process.env.AUTHENTICATED_REDIRECT_URL}`,
    },
    internal_jwt: {
        // This token is global to libero services
        secret: process.env.AUTHENTICATION_JWT_SECRET as string,
        expiresIn: '30m',
    },
    journal_jwt: {
        // This secret is used by journal to sign outgoing tokens, and used here to verify those
        // tokens
        secret: process.env.CONTINUUM_LOGIN_JWT_SECRET as string,
    },
    port: process.env.AUTHENTICATION_PORT || 3001,
    event: eventConfig,
};

console.log(process.env.AUTHENTICATION_JWT_SECRET);

export default config;
