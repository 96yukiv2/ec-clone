import {Inject} from '@nestjs/common';
import {Injectable,BadRequestException,ConflictException} from '@nestjs/common';
import {Db} from '../../common/db';
import {money} from '../../common/validation';
@Injectable()
export class GuestRepository{
 constructor(@Inject(Db) private readonly db:Db){}
 async checkout(data:{hash:string;email:string;key:string;items:Map<number,number>;coupon:string;address:unknown}){
  const {hash,email,key,items,coupon,address}=data;
  return this.db.transaction(async tx=>{
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[hash+':'+key]);
   const old=(await tx.query('SELECT * FROM orders WHERE guest_token_hash=$1 AND idempotency_key=$2',[hash,key])).rows[0];
   if(old)return old;
   const productIds=[...items.keys()].sort((a,b)=>a-b);
   const products=(await tx.query('SELECT id,name,price,stock FROM products WHERE id=ANY($1::int[]) AND active=true ORDER BY id FOR UPDATE',[productIds])).rows;
   if(products.length!==productIds.length||products.some(p=>p.stock<(items.get(p.id)||0)))throw new ConflictException('在庫が不足しています');
   const subtotal=products.reduce((total,p)=>total+p.price*items.get(p.id)!,0);
   let percent=0;
   if(coupon){
    const result=(await tx.query('SELECT discount_percent FROM coupons WHERE code=$1 AND active=true',[coupon])).rows[0];
    if(!result)throw new BadRequestException('クーポンが無効です');
    percent=result.discount_percent;
   }
   const totals=money(subtotal,percent);
   const order=(await tx.query('INSERT INTO orders(guest_email,guest_token_hash,subtotal,discount,shipping,total,coupon_code,shipping_address,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[email,hash,subtotal,totals.discount,totals.shipping,totals.total,coupon||null,address?JSON.stringify(address):null,key])).rows[0];
   for(const product of products){
    const quantity=items.get(product.id)!;
    await tx.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[quantity,product.id]);
    await tx.query('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES($1,$2,$3,$4,$5)',[order.id,product.id,product.name,product.price,quantity]);
   }
   return order;
  });
 }
 async orders(hash:string){return (await this.db.query('SELECT id,status,subtotal,discount,shipping,total,created_at FROM orders WHERE guest_token_hash=$1 ORDER BY created_at DESC',[hash])).rows;}
 async pay(hash:string,orderId:number,succeed:boolean){
  return this.db.transaction(async tx=>{
   const order=(await tx.query('SELECT * FROM orders WHERE id=$1 AND guest_token_hash=$2 FOR UPDATE',[orderId,hash])).rows[0];
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(order.status==='paid'&&succeed)return order;
   if(!['pending_payment','payment_failed'].includes(order.status))throw new ConflictException('決済済み・キャンセル済みの注文です');
   const status=succeed?'paid':'payment_failed';
   const updated=(await tx.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 RETURNING *',[status,orderId])).rows[0];
   if(succeed)await tx.query('INSERT INTO outbox(event_type,payload) VALUES($1,$2)',['order.paid',JSON.stringify({orderId,email:order.guest_email})]);
   return updated;
  });
 }
}
