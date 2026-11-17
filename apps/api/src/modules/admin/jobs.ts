import {Controller,Get,Post,Req,Param} from '@nestjs/common';
import {Request} from 'express';
import {JobsService} from './jobs.service';
@Controller('admin/jobs')
export class JobsController{
 constructor(private readonly service:JobsService){}
 @Get() jobs(@Req() req:Request){return this.service.jobs(req);}
 @Post('retry/:id') retry(@Req() req:Request,@Param('id') id:string){return this.service.retry(req,id);}
 @Post('expire') expire(@Req() req:Request){return this.service.expire(req);}
}