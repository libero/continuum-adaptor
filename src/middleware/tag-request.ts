import { Response, NextFunction } from 'express';
import { v4 } from 'uuid';
import { CustomRequest } from '../domain/types';

// TODO: replace any when there is agreement on error structure.
export default function tagRequest(req: CustomRequest, _: Response, next: NextFunction): void {
    if (req.header('x-elife-request-tag')) {
        req.requestTag = v4();
        return next();
    }
    req.requestTag = v4();
    return next();
}
