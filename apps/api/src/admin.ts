import {Controller,Get,Post,Patch,Param,Body,Req,BadRequestException,ConflictException} from '@nestjs/common';
import {Request} from 'express';
import {Db} from './db';
import {Auth} from './auth';
const positive=(x:any)=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
@Controller('admin')
export class AdminController {
 constructor(private db:Db,private auth:Auth){}
 @Get('summary') async summary(@Req() req:Request){
  await this.auth.required(req,true);
  const [counts,stock,trend,ranking]=await Promise.all([
   this.db.query("SELECT count(*)::int orders,coalesce(sum(total) FILTER (WHERE status IN ('paid','shipped','delivered')),0)::bigint revenue FROM orders"),
   this.db.query('SELECT id,name,stock FROM products WHERE stock<=5 ORDER BY stock,id LIMIT 25'),
   this.db.query("SELECT date_trunc('day',created_at)::date day,sum(total)::bigint total FROM orders WHERE status IN ('paid','shipped','delivered') GROUP BY 1 ORDER BY 1 DESC LIMIT 30"),
   this.db.query('SELECT p.id,p.name,coalesce(sum(oi.quantity),0)::int sold FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id GROUP BY p.id ORDER BY sold DESC LIMIT 10')
  ]);
  return {orders:counts.rows[0],lowStock:stock.rows,trend:trend.rows,ranking:ranking.rows};
 }
 @Get('orders') async orders(@Req() req:Request){
  await this.auth.required(req,true);
  return (await this.db.query('SELECT o.*,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 100')).rows;
 }
 @Patch('orders/:id') async status(@Req() req:Request,@Param('id') oid:string,@Body() b:any){
  const u=await this.auth.required(req,true);
  const status=String(b?.status||'');
  if(!['shipped','delivered'].includes(status))throw new BadRequestException('Invalid status');
  const from=status==='shipped'?'paid':'shipped';
  const row=await this.db.query('UPDATE orders SET status=$1 WHERE id=$2 AND status=$3 RETURNING *',[status,positive(oid),from]);
  if(!row.rows.length)throw new ConflictException('Invalid order transition');
  await this.log(u.id,'order.status',{orderId:positive(oid),status});return row.rows[0];
 }
 @Post('products') async create(@Req() req:Request,@Body() b:any){
  const u=await this.auth.required(req,true);
  const name=String(b?.name||'').trim(),slug=String(b?.slug||'').trim(),price=b?.price,stock=b?.stock;
  if(!name||name.length>150||!/^[a-z0-9-]{2,100}$/.test(slug)||!Number.isSafeInteger(price)||price<0||!Number.isSafeInteger(stock)||stock<0)throw new BadRequestException('Invalid product');
  const row=await this.db.query('INSERT INTO products(name,slug,description,price,stock,category_id,image) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[name,slug,String(b.description||''),price,stock,b.categoryId||null,String(b.image||'')]);
  await this.log(u.id,'product.create',{productId:row.rows[0].id});return row.rows[0];
 }
 @Patch('products/:id') async update(@Req() req:Request,@Param('id') pid:string,@Body() b:any){
  const u=await this.auth.required(req,true);
  const fields:Record<string,string>={name:'name',description:'description',price:'price',stock:'stock',active:'active',image:'image',categoryId:'category_id'};
  const entries=Object.entries(b||{}).filter(([k])=>k in fields);
  if(!entries.length)throw new BadRequestException('No supported fields');
  if(entries.some(([k,v])=>['price','stock'].includes(k)&&(!Number.isSafeInteger(v)||Number(v)<0)))throw new BadRequestException('Invalid price or stock');
  if(entries.some(([k,v])=>k==='active'&&typeof v!=='boolean'))throw new BadRequestException('Invalid active flag');
  const assignments=entries.map(([k],i)=>fields[k]+'=$'+(i+1)).join(',');
  const row=await this.db.query('UPDATE products SET '+assignments+' WHERE id=$'+(entries.length+1)+' RETURNING *',[...entries.map(x=>x[1]),positive(pid)]);
  if(!row.rows.length)throw new BadRequestException('Unknown product');
  await this.log(u.id,'product.update',{productId:positive(pid),fields:entries.map(x=>x[0])});return row.rows[0];
 }
 @Get('audit') async audit(@Req() req:Request){
  await this.auth.required(req,true);return (await this.db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')).rows;
 }
 private log(actorId:number,action:string,details:unknown){
  return this.db.query('INSERT INTO audit_logs(actor_id,action,details) VALUES($1,$2,$3)',[actorId,action,JSON.stringify(details)]);
 }
}
