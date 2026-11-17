import {Injectable} from '@nestjs/common';
import {Request} from 'express';
import {Auth} from '../auth/auth';
import {JobsRepository} from './jobs.repository';
import {int} from '../../common/validation';
@Injectable()
export class JobsService{
 constructor(private readonly repository:JobsRepository,private readonly auth:Auth){}
 async jobs(req:Request){await this.auth.required(req,true);return this.repository.list();}
 async retry(req:Request,id:string){await this.auth.required(req,true);await this.repository.retry(int(id,1));return {ok:true};}
 async expire(req:Request){await this.auth.required(req,true);return this.repository.expire();}
}