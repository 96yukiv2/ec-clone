import {Injectable} from '@nestjs/common';
import {Db} from '../../common/db';
@Injectable()
export class JobsRepository{
 constructor(private readonly db:Db){}
 async list(){return (await this.db.query('SELECT id,event_type,attempts,available_at,processed_at FROM outbox ORDER BY id DESC LIMIT 100')).rows;}
 async retry(id:number){await this.db.query("UPDATE outbox SET attempts=0,available_at=now(),processed_at=NULL WHERE id=$1",[id]);}
 async expire(){
  return this.db.transaction(async tx=>{
   const due=(await tx.query("SELECT id FROM orders WHERE status IN ('pending_payment','payment_failed') AND created_at<now()-interval '30 minutes' FOR UPDATE SKIP LOCKED")).rows;
   for(const order of due){
    const items=(await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[order.id])).rows;
    for(const item of items)await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[item.quantity,item.product_id]);
    await tx.query("UPDATE orders SET status='expired',updated_at=now() WHERE id=$1",[order.id]);
   }
   return {expired:due.length};
  });
 }
}