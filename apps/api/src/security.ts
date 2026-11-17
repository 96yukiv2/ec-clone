import {Injectable,NestMiddleware,TooManyRequestsException,ForbiddenException} from '@nestjs/common';
import type {Request,Response,NextFunction} from 'express';
import Redis from 'ioredis';
@Injectable()
export class SecurityMiddleware implements NestMiddleware{
 private redis=new Redis(process.env.REDIS_URL||'redis://localhost:6379',{maxRetriesPerRequest:1,lazyConnect:true});
 async use(req:Request,res:Response,next:NextFunction){
  if(['POST','PUT','PATCH','DELETE'].includes(req.method)){
   const origin=req.headers.origin;
   if(origin && origin!=='http://localhost:3000')return next(new ForbiddenException('Invalid origin'));
   const referer=req.headers.referer;
   if(!origin && referer && !referer.startsWith('http://localhost:3000/'))return next(new ForbiddenException('Invalid referer'));
  }
  if(req.path==='/auth/login'||req.path==='/auth/register'){
   try{
    if(this.redis.status==='wait')await this.redis.connect();
    const key='auth-limit:'+String(req.ip||'unknown');
    const count=await this.redis.incr(key);
    if(count===1)await this.redis.expire(key,60);
    if(count>12)return next(new TooManyRequestsException('Please retry in a minute'));
   }catch(error){if(error instanceof TooManyRequestsException)return next(error);return next(new TooManyRequestsException('Login protection unavailable'));}
  }
  next();
 }
}
