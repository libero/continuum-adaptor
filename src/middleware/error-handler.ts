import { Request, Response, NextFunction } from 'express';

// TODO: replace any when there is agreement on error handling.
export default function errorHandler(error: any, req: Request, res: Response, next: NextFunction): Response {
    const { status = 500, type = 'non-specific-error', msg } = error;
    console.log('error', { status, type });
    return res.status(status).send({ msg });
}
