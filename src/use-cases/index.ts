import { Request, Response } from 'express';
import { DomainLogger as logger } from '../logger';

export * from './authenticate';

export const HealthCheck = () => (_req: Request, res: Response): void => {
    logger.info('healthCheck');
    res.json({ ok: true });
};
