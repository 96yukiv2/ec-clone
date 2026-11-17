import {Injectable,BadRequestException,ConflictException} from '@nestjs/common';
import {Db} from '../../common/db';
import {int,money} from '../../common/validation';
@Injectable()
export class OrdersService{
 constructor(private readonly db:Db){}
 async cart(userId:number){
  return (await this.db.query('SELECT c.product_id,c.quantity,p.name,p.price,p.stock,p.image FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 ORDER BY p.name',[userId])).rows;
 }
 async setCart(userId:number,productId:unknown,quantity:unknown){
  const pid=int(productId,1),qty=int(quantity,0,99);
  if(!qty)await this.db.query('DELETE FROM carts WHERE user_id=$1 AND product_id=$2',[userId,pid]);
  else {
   const available=await this.db.query('SELECT 1 FROM products WHERE id=$1 AND active=true',[pid]);
   if(!available.rowCount)throw new BadRequestException('商品が見つかりません');
   await this.db.query('INSERT INTO carts(user_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT (user_id,product_id) DO UPDATE SET quantity=excluded.quantity',[userId,pid,qty]);
  }
  return this.cart(userId);
 }
 async list(userId:number){return (await this.db.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[userId])).rows;}
 async detail(userId:number,orderId:unknown){
  const oid=int(orderId,1);
  const row=(await this.db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2',[oid,userId])).rows[0];
  if(!row)throw new BadRequestException('注文が見つかりません');
  return {...row,items:(await this.db.query('SELECT * FROM order_items WHERE order_id=$1',[oid])).rows};
 }
 async checkout(userId:number,body:any){
  const key=String(body?.idempotencyKey||'').trim();
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))throw new BadRequestException('冪等性キーが不正です');
  const coupon=String(body?.couponCode||'').trim().toUpperCase();
  const addressId=body?.addressId?int(body.addressId,1):null;
  return this.db.transaction(async tx=>{
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[userId+':'+key]);
   const prior=(await tx.query('SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2',[userId,key])).rows[0];if(prior)return prior;
   const items=(await tx.query('SELECT c.product_id,c.quantity,p.name,p.price,p.stock FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 AND p.active=true ORDER BY p.id FOR UPDATE OF p',[userId])).rows;
   if(!items.length)throw new BadRequestException('カートが空です');
   if(items.some(x=>x.quantity>x.stock))throw new ConflictException('在庫不足です');
   let percent=0;
   if(coupon){
    const c=(await tx.query('SELECT discount_percent FROM coupons WHERE code=$1 AND active=true',[coupon])).rows[0];
    if(!c)throw new BadRequestException('クーポンが無効です');percent=c.discount_percent;
   }
   let address=null;
   if(addressId){
    address=(await tx.query('SELECT postal_code,region,city,line1,line2 FROM addresses WHERE id=$1 AND user_id=$2',[addressId,userId])).rows[0];
    if(!address)throw new BadRequestException('配送先が見つかりません');
   }
   const subtotal=items.reduce((sum,x)=>sum+x.price*x.quantity,0);
   const totals=money(subtotal,percent);
   const order=(await tx.query('INSERT INTO orders(user_id,subtotal,discount,shipping,total,coupon_code,shipping_address,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[userId,subtotal,totals.discount,totals.shipping,totals.total,coupon||null,address?JSON.stringify(address):null,key])).rows[0];
   for(const item of items){
    await tx.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[item.quantity,item.product_id]);
    await tx.query('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES($1,$2,$3,$4,$5)',[order.id,item.product_id,item.name,item.price,item.quantity]);
   }
   await tx.query('DELETE FROM carts WHERE user_id=$1',[userId]);
   return order;
  });
 }
 async pay(userId:number,orderId:unknown,succeed:boolean){
  const oid=int(orderId,1);
  return this.db.transaction(async tx=>{
   const previous=(await tx.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[oid,userId])).rows[0];
   if(!previous)throw new BadRequestException('注文が見つかりません');
   if(previous.status==='paid'&&succeed)return previous;
   if(!['pending_payment','payment_failed'].includes(previous.status))throw new ConflictException('決済できない注文状態です');
   const status=succeed?'paid':'payment_failed';
   const order=(await tx.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 RETURNING *',[status,oid])).rows[0];
   if(succeed)await tx.query('INSERT INTO outbox(event_type,payload) VALUES($1,$2)',['order.paid',JSON.stringify({orderId:oid})]);
   return order;
  });
 }
 async cancel(userId:number,orderId:unknown){
  const oid=int(orderId,1);
  return this.db.transaction(async tx=>{
   const order=(await tx.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[oid,userId])).rows[0];
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(order.status==='cancelled')return order;
   if(!['pending_payment','payment_failed','paid'].includes(order.status))throw new ConflictException('この注文はキャンセルできません');
   const items=(await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[oid])).rows;
   for(const item of items)await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[item.quantity,item.product_id]);
   return (await tx.query("UPDATE orders SET status='cancelled',updated_at=now() WHERE id=$1 RETURNING *",[oid])).rows[0];
  });
 }
 async refund(userId:number,orderId:unknown){
  const oid=int(orderId,1);
  return this.db.transaction(async tx=>{
   const order=(await tx.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[oid,userId])).rows[0];
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(order.status==='refunded')return order;
   if(!['delivered','paid'].includes(order.status))throw new ConflictException('返金できない注文状態です');
   if(order.status==='paid'){
    const items=(await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[oid])).rows;
    for(const i of items)await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[i.quantity,i.product_id]);
   }
   const updated=(await tx.query("UPDATE orders SET status='refunded',updated_at=now() WHERE id=$1 RETURNING *",[oid])).rows[0];
   await tx.query('INSERT INTO outbox(event_type,payload) VALUES($1,$2)',['order.refunded',JSON.stringify({orderId:oid})]);
   return updated;
  });
 }
 async webhook(eventId:string,orderId:number,outcome:'paid'|'payment_failed'){
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(eventId))throw new BadRequestException('Invalid event');
  return this.db.transaction(async tx=>{
   const existing=await tx.query('SELECT event_id FROM payment_events WHERE event_id=$1',[eventId]);
   if(existing.rowCount)return {duplicate:true};
   const order=(await tx.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[orderId])).rows[0];
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(!['pending_payment','payment_failed'].includes(order.status))throw new ConflictException('決済処理は完了済みです');
   await tx.query('INSERT INTO payment_events(event_id,order_id,outcome) VALUES($1,$2,$3)',[eventId,orderId,outcome]);
   await tx.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2',[outcome,orderId]);
   if(outcome==='paid')await tx.query('INSERT INTO outbox(event_type,payload) VALUES($1,$2)',['order.paid',JSON.stringify({orderId})]);
   return {duplicate:false,status:outcome};
  });
 }
}
