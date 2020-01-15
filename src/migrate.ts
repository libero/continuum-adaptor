import { Cli } from '@libero/migrator';
import config from './config';

const cli = new Cli({
    banner: 'Continuum Adaptor Service: Migration tool',
    name: 'migrate',
    knexConfig: config.knex,
    migrations: {
        path: `${__dirname}/migrations`,
        pattern: /.*\.ts$/,
    },
});

cli.exec();
