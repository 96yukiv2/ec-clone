import {Pool} from 'pg';
import nodemailer from 'nodemailer';
import Redis from 'ioredis';
import {Queue,Worker} from 'bullmq';
const db=new Pool({connectionString:process.env.DATABASE_URL});
const redisUrl=new URL(process.env.REDIS_URL||'redis://localhost:6379');
const connection={host:redisUrl.hostname,port:Number(redisUrl.port||6379),maxRetriesPerRequest:null};
const queue=new Queue('notifications',{connection});
const smtp=nodemailer.createTransport({host:process.env.SMTP_HOST||'mailpit',port:Number(process.env.SMTP_PORT||1025),secure:false});
const worker=new Worker('notifications',async job=>{
 if(job.name==='order.paid'){
  const {orderId,email}=job.data;
  let target=email;
  if(!target){const r=await db.query('SELECT u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1',[orderId]);target=r.rows[0]?.email;}
  if(target)await smtp.sendMail({from:'orders@ec-clone.local',to:target,subject:'Your order #'+orderId+' is confirmed',text:'Order #'+orderId+' has been paid (MOCK).'});
 }
},{connection,concurrency:3});
worker.on('failed',(job,error)=>console.error('Job failed',job?.id,error.message));
async function poll(){
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const rows=(await client.query("SELECT id,event_type,payload FROM outbox WHERE processed_at IS NULL AND attempts<10 AND available_at<=now() ORDER BY id LIMIT 20 FOR UPDATE SKIP LOCKED")).rows;
  for(const row of rows){
   try{
    await queue.add(row.event_type,row.payload,{jobId:'outbox-'+row.id,attempts:5,backoff:{type:'exponential',delay:2000},removeOnComplete:1000});
    await client.query('UPDATE outbox SET processed_at=now() WHERE id=$1',[row.id]);
   }catch(error){await client.query("UPDATE outbox SET attempts=attempts+1,available_at=now()+interval '15 seconds' WHERE id=$1",[row.id]);}
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');console.error(e);}finally{client.release();}
}
async function expire(){
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const rows=(await client.query("SELECT id FROM orders WHERE status IN ('pending_payment','payment_failed') AND created_at < now()-interval '30 minutes' FOR UPDATE SKIP LOCKED LIMIT 100")).rows;
  for(const order of rows){
   const items=(await client.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[order.id])).rows;
   for(const item of items)await client.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[item.quantity,item.product_id]);
   await client.query("UPDATE orders SET status='expired',updated_at=now() WHERE id=$1",[order.id]);
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');console.error(e);}finally{client.release();}
}
async function run(){await poll();await expire();setTimeout(run,10000);}
run().catch(console.error);
