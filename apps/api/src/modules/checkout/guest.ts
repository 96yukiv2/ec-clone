import {Controller,Post,Get,Req,Res,Body,Param} from '@nestjs/common';
import {Request,Response} from 'express';
import {GuestService} from './guest.service';
@Controller('guest')
export class GuestController{
 constructor(private readonly service:GuestService){}
 @Post('checkout') checkout(@Body() body:any,@Req() req:Request,@Res({passthrough:true}) res:Response){return this.service.checkout(body,req,res);}
 @Get('orders') orders(@Req() req:Request){return this.service.orders(req);}
 @Post('orders/:id/pay') pay(@Req() req:Request,@Param('id') id:string,@Body() body:any){return this.service.pay(req,id,body);}
}