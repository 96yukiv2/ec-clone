import {Controller,Get,Post,Put,Delete,Req,Body,Param,BadRequestException,ConflictException} from '@nestjs/common';
import {Request} from 'express';
import {Db} from './db';
import {Auth} from './auth';
const n=(x:any)=>Number.isSafeInteger(Number(x))?Number(x):0;
@Controller()
export class OrdersController {
 constructor(private db:Db,private auth:Auth){}
 @Get('cart') async cart(@Req() req:Request){
  const u=await this.auth.required(req);
  return (await this.db.query('SELECT c.product_id,c.quantity,p.name,p.price,p.stock FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1',[u.id])).rows;
 }
 @Put('cart/:id') async cartUpdate(@Req() req:Request,@Param('id') productId:string,@Body() b:any){
  const u=await this.auth.required(req),qty=n(b?.quantity),id=n(productId);
  if(id<=0||qty<0||qty>99)throw new BadRequestException('Invalid quantity');
  if(qty===0)await this.db.query('DELETE FROM carts WHERE user_id=$1 AND product_id=$2',[u.id,id]);
  else await this.db.query('INSERT INTO carts(user_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT (user_id,product_id) DO UPDATE SET quantity=excluded.quantity',[u.id,id,qty]);
  return this.cart(req);
 }
 @Get('orders') async orders(@Req() req:Request){
  const u=await this.auth.required(req);return (await this.db.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[u.id])).rows;
 }
 @Get('orders/:id') async detail(@Req() req:Request,@Param('id') oid:string){
  const u=await this.auth.required(req);
  const order=(await this.db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2',[n(oid),u.id])).rows[0];
  if(!order)throw new BadRequestException('Order not found');
  return {...order,items:(await this.db.query('SELECT * FROM order_items WHERE order_id=$1',[order.id])).rows};
 }
 @Post('orders') async checkout(@Req() req:Request,@Body() b:any){
  const u=await this.auth.required(req),key=String(b?.idempotencyKey||'');
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))throw new BadRequestException('Invalid idempotency key');
  return this.db.transaction(async tx=>{
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[u.id+':'+key]);
   const prev=(await tx.query('SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2',[u.id,key])).rows[0];
   if(prev)return prev;
   const items=(await tx.query('SELECT c.product_id,c.quantity,p.name,p.price,p.stock FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 AND p.active=true ORDER BY p.id FOR UPDATE OF p',[u.id])).rows;
   if(!items.length)throw new BadRequestException('Empty cart');
   if(items.some(i=>i.stock<i.quantity))throw new ConflictException('Insufficient stock');
   let percent=0;
   const coupon=String(b?.couponCode||'').trim().toUpperCase();
   if(coupon){
    const c=(await tx.query('SELECT discount_percent FROM coupons WHERE code=$1 AND active=true',[coupon])).rows[0];
    if(!c)throw new BadRequestException('Invalid coupon');percent=c.discount_percent;
   }
   const subtotal=items.reduce((s,i)=>s+i.price*i.quantity,0),discount=Math.floor(subtotal*percent/100),shipping=subtotal-discount>=5000?0:500,total=subtotal-discount+shipping;
   const order=(await tx.query('INSERT INTO orders(user_id,subtotal,discount,shipping,total,coupon_code,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[u.id,subtotal,discount,shipping,total,coupon||null,key])).rows[0];
   for(const item of items){
    await tx.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[item.quantity,item.product_id]);
    await tx.query('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES($1,$2,$3,$4,$5)',[order.id,item.product_id,item.name,item.price,item.quantity]);
   }
   await tx.query('DELETE FROM carts WHERE user_id=$1',[u.id]);return order;
  });
 }
 @Post('orders/:id/pay') async pay(@Req() req:Request,@Param('id') oid:string,@Body() b:any){
  const u=await this.auth.required(req);
  const status=b?.succeed===true?'paid':'payment_failed';
  const row=await this.db.query("UPDATE orders SET status=$1 WHERE id=$2 AND user_id=$3 AND status IN ('pending_payment','payment_failed') RETURNING *",[status,n(oid),u.id]);
  if(row.rows.length)return row.rows[0];
  const existing=(await this.db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2',[n(oid),u.id])).rows[0];
  if(!existing)throw new BadRequestException('Order not found');return existing;
 }
 @Post('orders/:id/cancel') async cancel(@Req() req:Request,@Param('id') oid:string){
  const u=await this.auth.required(req);
  return this.db.transaction(async tx=>{
   const order=(await tx.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[n(oid),u.id])).rows[0];
   if(!order)throw new BadRequestException('Order not found');
   if(order.status==='cancelled')return order;
   if(!['pending_payment','payment_failed','paid'].includes(order.status))throw new ConflictException('Already shipped');
   const items=(await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[order.id])).rows;
   for(const item of items)await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[item.quantity,item.product_id]);
   return (await tx.query("UPDATE orders SET status='cancelled' WHERE id=$1 RETURNING *",[order.id])).rows[0];
  });
 }
}
