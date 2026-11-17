import {Inject} from '@nestjs/common';
import {Injectable} from '@nestjs/common';
import type {PoolClient} from 'pg';
import {Db} from '../../common/db';

export type CartLine={product_id:number;quantity:number;name:string;price:number;stock:number;image?:string};
export type OrderRecord={id:number;user_id:number|null;status:string;total:number;subtotal:number;discount:number;shipping:number;idempotency_key:string};
class CheckoutTransaction {
 constructor(private readonly tx:PoolClient){}
 async lockKey(key:string){await this.tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[key]);}
 async findByKey(userId:number,key:string){return (await this.tx.query('SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2',[userId,key])).rows[0] as OrderRecord|undefined;}
 async lockCart(userId:number):Promise<CartLine[]>{return (await this.tx.query('SELECT c.product_id,c.quantity,p.name,p.price,p.stock FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 AND p.active=true ORDER BY p.id FOR UPDATE OF p',[userId])).rows;}
 async discountPercent(code:string){return (await this.tx.query('SELECT discount_percent FROM coupons WHERE code=$1 AND active=true',[code])).rows[0]?.discount_percent as number|undefined;}
 async address(userId:number,id:number){return (await this.tx.query('SELECT postal_code,region,city,line1,line2 FROM addresses WHERE id=$1 AND user_id=$2',[id,userId])).rows[0];}
 async createOrder(userId:number,args:{subtotal:number;discount:number;shipping:number;total:number;coupon:string;address:unknown;key:string}){
  const {subtotal,discount,shipping,total,coupon,address,key}=args;
  return (await this.tx.query('INSERT INTO orders(user_id,subtotal,discount,shipping,total,coupon_code,shipping_address,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[userId,subtotal,discount,shipping,total,coupon||null,address?JSON.stringify(address):null,key])).rows[0] as OrderRecord;
 }
 async reserve(orderId:number,item:CartLine){
  await this.tx.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[item.quantity,item.product_id]);
  await this.tx.query('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES($1,$2,$3,$4,$5)',[orderId,item.product_id,item.name,item.price,item.quantity]);
 }
 async emptyCart(userId:number){await this.tx.query('DELETE FROM carts WHERE user_id=$1',[userId]);}
 async lockOrder(orderId:number,userId?:number){
  const sql=userId===undefined?'SELECT * FROM orders WHERE id=$1 FOR UPDATE':'SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE';
  return (await this.tx.query(sql,userId===undefined?[orderId]:[orderId,userId])).rows[0] as OrderRecord|undefined;
 }
 async items(orderId:number){return (await this.tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[orderId])).rows as {product_id:number;quantity:number}[];}
 async restore(items:{product_id:number;quantity:number}[]){for(const item of items)await this.tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[item.quantity,item.product_id]);}
 async status(orderId:number,status:string){return (await this.tx.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 RETURNING *',[status,orderId])).rows[0] as OrderRecord;}
 async event(eventType:string,orderId:number){await this.tx.query('INSERT INTO outbox(event_type,payload) VALUES($1,$2)',[eventType,JSON.stringify({orderId})]);}
 async hasPaymentEvent(eventId:string){return Boolean((await this.tx.query('SELECT event_id FROM payment_events WHERE event_id=$1',[eventId])).rowCount);}
 async paymentEvent(eventId:string,orderId:number,outcome:string){await this.tx.query('INSERT INTO payment_events(event_id,order_id,outcome) VALUES($1,$2,$3)',[eventId,orderId,outcome]);}
}
@Injectable()
export class OrdersRepository{
 constructor(@Inject(Db) private readonly db:Db){}
 async cart(userId:number):Promise<CartLine[]>{return (await this.db.query('SELECT c.product_id,c.quantity,p.name,p.price,p.stock,p.image FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 ORDER BY p.name',[userId])).rows as CartLine[];}
 async removeItem(userId:number,productId:number){await this.db.query('DELETE FROM carts WHERE user_id=$1 AND product_id=$2',[userId,productId]);}
 async productExists(productId:number){return Boolean((await this.db.query('SELECT 1 FROM products WHERE id=$1 AND active=true',[productId])).rowCount);}
 async putItem(userId:number,productId:number,quantity:number){await this.db.query('INSERT INTO carts(user_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT (user_id,product_id) DO UPDATE SET quantity=excluded.quantity',[userId,productId,quantity]);}
 async orders(userId:number){return (await this.db.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[userId])).rows;}
 async detail(userId:number,orderId:number){return (await this.db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2',[orderId,userId])).rows[0];}
 async detailItems(orderId:number){return (await this.db.query('SELECT * FROM order_items WHERE order_id=$1',[orderId])).rows;}
 transaction<T>(fn:(tx:CheckoutTransaction)=>Promise<T>):Promise<T>{return this.db.transaction(client=>fn(new CheckoutTransaction(client)));}
}
