import {Controller,Get,Post,Put,Req,Body,Param,ForbiddenException} from '@nestjs/common';
import {Request} from 'express';
import {Auth} from './auth';
import {OrdersService} from './orders.service';
import {int,str} from './validation';
@Controller()
export class OrdersController{
 constructor(private readonly auth:Auth,private readonly orders:OrdersService){}
 @Get('cart') async cart(@Req() req:Request){return this.orders.cart((await this.auth.required(req)).id);}
 @Put('cart/:id') async setCart(@Req() req:Request,@Param('id') id:string,@Body() b:any){return this.orders.setCart((await this.auth.required(req)).id,id,b?.quantity);}
 @Get('orders') async list(@Req() req:Request){return this.orders.list((await this.auth.required(req)).id);}
 @Get('orders/:id') async detail(@Req() req:Request,@Param('id') id:string){return this.orders.detail((await this.auth.required(req)).id,id);}
 @Post('orders') async checkout(@Req() req:Request,@Body() b:any){return this.orders.checkout((await this.auth.required(req)).id,b);}
 @Post('orders/:id/pay') async pay(@Req() req:Request,@Param('id') id:string,@Body() b:any){return this.orders.pay((await this.auth.required(req)).id,id,b?.succeed===true);}
 @Post('orders/:id/cancel') async cancel(@Req() req:Request,@Param('id') id:string){return this.orders.cancel((await this.auth.required(req)).id,id);}
 @Post('orders/:id/refund') async refund(@Req() req:Request,@Param('id') id:string){return this.orders.refund((await this.auth.required(req)).id,id);}
 @Post('mock-webhooks/payment')
 async webhook(@Req() req:Request,@Body() b:any){
  // Local-only simulation. No external endpoint should call this.
  if(req.headers.origin && req.headers.origin!=='http://localhost:3000')throw new ForbiddenException();
  await this.auth.required(req,true);
  return this.orders.webhook(str(b?.eventId,8,100),int(b?.orderId,1),b?.outcome==='paid'?'paid':'payment_failed');
 }
}
