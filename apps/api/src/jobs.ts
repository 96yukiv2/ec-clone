import {Controller,Get,Post,Req,Param,Body} from '@nestjs/common';
import {Request} from 'express';
import {Db} from './db';
import {Auth} from './auth';
@Controller('admin/jobs')
export class JobsController{
 constructor(private db:Db,private auth:Auth){}
 @Get() async jobs(@Req() req:Request){
  await this.auth.required(req,true);
  return (await this.db.query("SELECT id,event_type,attempts,available_at,processed_at FROM outbox ORDER BY id DESC LIMIT 100")).rows;
 }
 @Post('retry/:id') async retry(@Req() req:Request,@Param('id') id:string){
  await this.auth.required(req,true);
  await this.db.query("UPDATE outbox SET attempts=0,available_at=now(),processed_at=NULL WHERE id=$1",[Number(id)]);return {ok:true};
 }
 @Post('expire') async expire(@Req() req:Request){
  await this.auth.required(req,true);
  return this.db.transaction(async tx=>{
   const due=(await tx.query("SELECT id FROM orders WHERE status IN ('pending_payment','payment_failed') AND created_at<now()-interval '30 minutes' FOR UPDATE SKIP LOCKED")).rows;
   for(const x of due){
    const items=(await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[x.id])).rows;
    for(const i of items)await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[i.quantity,i.product_id]);
    await tx.query("UPDATE orders SET status='expired',updated_at=now() WHERE id=$1",[x.id]);
   }
   return {expired:due.length};
  });
 }
}
