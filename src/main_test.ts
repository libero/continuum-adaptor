import { InfraLogger as logger } from './logger';
import { PeopleService } from './repo/people';
import config from './config';

const token = process.env.ELIFE_API_GATEWAY_SECRET || '';

const init = async (): Promise<void> => {
    logger.info('Starting');
    const peopleService = new PeopleService({ url: `${config.continuum_api_url}/people`, token });
    const result = await peopleService.getPeopleByRole('reviewing-editor');
    console.log(JSON.stringify(result, null, 4));
};

init();
