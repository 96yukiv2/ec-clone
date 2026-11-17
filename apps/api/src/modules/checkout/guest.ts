import {Controller,Post,Get,Req,Res,Body,Param,BadRequestException,ConflictException,ForbiddenException} from '@nestjs/common';
import {Request,Response} from 'express';
import {createHash,randomBytes} from 'node:crypto';
import {Db} from '../../common/db';
import {money,int,str} from '../../common/validation';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
@Controller('guest')
export class GuestController{
 constructor(private db:Db){}
 @Post('checkout')
 async checkout(@Body() b:any,@Res({passthrough:true}) res:Response,@Req() req:Request){
  const email=str(b?.email,3,200).toLowerCase();
  if(!/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(email))throw new BadRequestException('Invalid email');
  if(!Array.isArray(b?.items)||!b.items.length||b.items.length>30)throw new BadRequestException('Invalid cart');
  const requested=new Map<number,number>();
  for(const item of b.items){const pid=int(item.productId,1),quantity=int(item.quantity,1,99);requested.set(pid,(requested.get(pid)||0)+quantity);}
  if([...requested.values()].some(q=>q>99))throw new BadRequestException('Quantity too large');
  const key=str(b?.idempotencyKey,8,100);
  let token=req.cookies?.guest_token;
  if(!token || typeof token!=='string'){token=randomBytes(32).toString('hex');res.cookie('guest_token',token,{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:86400_000});}
  const hash=digest(token);
  return this.db.transaction(async tx=>{
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[hash+':'+key]);
   const prev=(await tx.query('SELECT * FROM orders WHERE guest_token_hash=$1 AND idempotency_key=$2',[hash,key])).rows[0];if(prev)return prev;
   const pids=[...requested.keys()].sort((a,b)=>a-b);
   const products=(await tx.query('SELECT id,name,price,stock FROM products WHERE id=ANY($1::int[]) AND active=true ORDER BY id FOR UPDATE',[pids])).rows;
   if(products.length!==pids.length || products.some(p=>p.stock<(requested.get(p.id)||0)))throw new ConflictException('Product unavailable');
   const subtotal=products.reduce((s,p)=>s+p.price*requested.get(p.id)!,0);
   let percent=0;const coupon=String(b?.couponCode||'').toUpperCase();
   if(coupon){const c=(await tx.query('SELECT discount_percent FROM coupons WHERE code=$1 AND active=true',[coupon])).rows[0];if(!c)throw new BadRequestException('Invalid coupon');percent=c.discount_percent;}
   const totals=money(subtotal,percent);
   const address=b?.shippingAddress||null;
   const order=(await tx.query('INSERT INTO orders(guest_email,guest_token_hash,subtotal,discount,shipping,total,coupon_code,shipping_address,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[email,hash,subtotal,totals.discount,totals.shipping,totals.total,coupon||null,address?JSON.stringify(address):null,key])).rows[0];
   for(const p of products){
    const qty=requested.get(p.id)!;
    await tx.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[qty,p.id]);
    await tx.query('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES($1,$2,$3,$4,$5)',[order.id,p.id,p.name,p.price,qty]);
   }
   return order;
  });
 }
 @Get('orders') async orders(@Req() req:Request){
  const token=req.cookies?.guest_token;
  if(!token)return [];
  return (await this.db.query('SELECT id,status,subtotal,discount,shipping,total,created_at FROM orders WHERE guest_token_hash=$1 ORDER BY created_at DESC',[digest(token)])).rows;
 }
 @Post('orders/:id/pay') async pay(@Req() req:Request,@Param('id') id:string,@Body() b:any){
  if(!req.cookies?.guest_token)throw new ForbiddenException();
  const hash=digest(req.cookies.guest_token),status=b?.succeed===true?'paid':'payment_failed';
  const row=await this.db.query("UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 AND guest_token_hash=$3 AND status IN ('pending_payment','payment_failed') RETURNING *",[status,int(id,1),hash]);
  if(!row.rows.length)throw new ConflictException('Payment already finalized');
  if(status==='paid')await this.db.query('INSERT INTO outbox(event_type,payload) VALUES($1,$2)',['order.paid',JSON.stringify({orderId:row.rows[0].id,email:row.rows[0].guest_email})]);
  return row.rows[0];
 }
}
