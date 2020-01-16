import { Request, Response, NextFunction } from 'express';
import { DomainLogger as logger } from '../logger';
import { HttpError } from 'http-errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function errorHandler(error: HttpError, req: Request, res: Response, next: NextFunction): Response {
    const { status = 500, type = 'non-specific-error', msg, errors = [] } = error;
    logger.error({ status, type, msg });
    return res.status(status).send({ msg, errors });
}
