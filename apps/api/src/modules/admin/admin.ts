import {Controller,Get,Post,Patch,Param,Body,Req} from '@nestjs/common';
import {Request} from 'express';
import {AdminService} from './admin.service';
@Controller('admin')
export class AdminController{
 constructor(private readonly service:AdminService){}
 @Get('summary') summary(@Req() req:Request){return this.service.summary(req);}
 @Get('orders') orders(@Req() req:Request){return this.service.orders(req);}
 @Patch('orders/:id') status(@Req() req:Request,@Param('id') id:string,@Body() body:any){return this.service.status(req,id,body);}
 @Post('products') create(@Req() req:Request,@Body() body:any){return this.service.create(req,body);}
 @Patch('products/:id') update(@Req() req:Request,@Param('id') id:string,@Body() body:any){return this.service.update(req,id,body);}
 @Get('audit') audit(@Req() req:Request){return this.service.audit(req);}
 @Get('products/:id/prices') prices(@Req() req:Request,@Param('id') id:string){return this.service.prices(req,id);}
}