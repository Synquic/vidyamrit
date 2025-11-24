import { Request } from 'express';
import { IUser } from '../models/UserModel';
import { ParamsDictionary } from 'express-serve-static-core';

export interface AuthRequest<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any
> extends Request<P, ResBody, ReqBody> {
    user?: IUser;
}
