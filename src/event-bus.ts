import { RabbitEventBus, EventConfig } from '@libero/event-bus';
import { LiberoEventType } from '@libero/event-types';

export const setupEventBus = async (config: EventConfig): Promise<RabbitEventBus> => {
    const url = `amqp://${config.url}`;
    const eventBus = new RabbitEventBus({ url }, [LiberoEventType.userLoggedInIdentifier], 'continuum-adaptor');
    await eventBus.connect();
    return eventBus;
};
