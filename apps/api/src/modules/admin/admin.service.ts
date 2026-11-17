import {Injectable,BadRequestException,ConflictException} from '@nestjs/common';
import {Request} from 'express';
import {Db} from '../../common/db';
import {Auth} from '../auth/auth';
import {CacheService} from '../../common/cache';
import {int,str} from '../../common/validation';
@Injectable()
export class AdminService {
 constructor(private db:Db,private auth:Auth,private cache:CacheService){}
 @Get('summary') async summary(req:Request){
  await this.auth.required(req,true);
  const [counts,stock,trend,ranking]=await Promise.all([
   this.db.query("SELECT count(*)::int orders,coalesce(sum(total) FILTER (WHERE status IN ('paid','shipped','delivered')),0)::bigint revenue FROM orders"),
   this.db.query('SELECT id,name,stock FROM products WHERE stock<=5 ORDER BY stock,id LIMIT 25'),
   this.db.query("SELECT date_trunc('day',created_at)::date day,sum(total)::bigint total FROM orders WHERE status IN ('paid','shipped','delivered') GROUP BY 1 ORDER BY 1 DESC LIMIT 30"),
   this.db.query('SELECT p.id,p.name,coalesce(sum(oi.quantity),0)::int sold FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id GROUP BY p.id ORDER BY sold DESC LIMIT 10')
  ]);
  return {orders:counts.rows[0],lowStock:stock.rows,trend:trend.rows,ranking:ranking.rows};
 }
 @Get('orders') async orders(req:Request){
  await this.auth.required(req,true);
  return (await this.db.query('SELECT o.*,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 100')).rows;
 }
 @Patch('orders/:id') async status(req:Request,oid:string,b:any){
  const u=await this.auth.required(req,true),status=str(b?.status);
  if(!['shipped','delivered'].includes(status))throw new BadRequestException('不正な注文状態です');
  const from=status==='shipped'?'paid':'shipped';
  const row=await this.db.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 AND status=$3 RETURNING *',[status,int(oid,1),from]);
  if(!row.rows.length)throw new ConflictException('不正な注文遷移です');
  await this.log(u.id,'order.status',{orderId:int(oid,1),status});return row.rows[0];
 }
 @Post('products') async create(req:Request,b:any){
  const u=await this.auth.required(req,true);
  const name=str(b?.name,1,150),slug=str(b?.slug,2,100),price=int(b?.price,0),stock=int(b?.stock,0);
  if(!/^[a-z0-9-]+$/.test(slug))throw new BadRequestException('slugが不正です');
  const row=await this.db.query('INSERT INTO products(name,slug,description,price,stock,category_id,image,sku,parent_product_id,variant_label) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[name,slug,String(b.description||''),price,stock,b.categoryId||null,String(b.image||''),b.sku||null,b.parentProductId||null,b.variantLabel||null]);
  await this.log(u.id,'product.create',{productId:row.rows[0].id});await this.cache.invalidate('discover:');return row.rows[0];
 }
 @Patch('products/:id') async update(req:Request,pid:string,b:any){
  const u=await this.auth.required(req,true);
  const fields:Record<string,string>={name:'name',description:'description',price:'price',stock:'stock',active:'active',image:'image',categoryId:'category_id',sku:'sku',parentProductId:'parent_product_id',variantLabel:'variant_label'};
  const entries=Object.entries(b||{}).filter(([k])=>k in fields);
  if(!entries.length)throw new BadRequestException('更新項目がありません');
  if(entries.some(([k,v])=>['price','stock'].includes(k)&&(!Number.isSafeInteger(v)||Number(v)<0)))throw new BadRequestException('価格・在庫が不正です');
  if(entries.some(([k,v])=>k==='active'&&typeof v!=='boolean'))throw new BadRequestException('公開設定が不正です');
  const id=int(pid,1);
  const assignments=entries.map(([k],i)=>fields[k]+'=$'+(i+1)).join(',');
  const row=await this.db.transaction(async tx=>{
   const old=(await tx.query('SELECT price FROM products WHERE id=$1 FOR UPDATE',[id])).rows[0];
   if(!old)throw new BadRequestException('商品が見つかりません');
   const updated=(await tx.query('UPDATE products SET '+assignments+' WHERE id=$'+(entries.length+1)+' RETURNING *',[...entries.map(x=>x[1]),id])).rows[0];
   if(updated.price!==old.price)await tx.query('INSERT INTO price_history(product_id,price) VALUES($1,$2)',[id,updated.price]);
   await tx.query('INSERT INTO audit_logs(actor_id,action,details) VALUES($1,$2,$3)',[u.id,'product.update',JSON.stringify({productId:id,fields:entries.map(x=>x[0])})]);
   return updated;
  });
  await this.cache.invalidate('discover:');await this.cache.invalidate('facets:');
  return row;
 }
 @Get('audit') async audit(req:Request){
  await this.auth.required(req,true);return (await this.db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')).rows;
 }
 @Get('products/:id/prices') async prices(req:Request,pid:string){
  await this.auth.required(req,true);
  return (await this.db.query('SELECT price,created_at FROM price_history WHERE product_id=$1 ORDER BY created_at DESC LIMIT 100',[int(pid,1)])).rows;
 }
 private log(actorId:number,action:string,details:unknown){
  return this.db.query('INSERT INTO audit_logs(actor_id,action,details) VALUES($1,$2,$3)',[actorId,action,JSON.stringify(details)]);
 }
}
