import {Controller,Get,Query,Req,Param} from '@nestjs/common';
import {Request} from 'express';
import {Db} from './db';
import {Auth} from './auth';
import {CacheService} from './cache';
const number=(x:any,d=0)=>Number.isSafeInteger(Number(x))?Number(x):d;
@Controller('discovery')
export class DiscoveryController{
 constructor(private db:Db,private auth:Auth,private cache:CacheService){}
 private async cached(key:string,fn:()=>Promise<any>){
  const hit=await this.cache.get(key);
  if(hit!==null)return hit;
  const value=await fn();await this.cache.put(key,value,60);return value;
 }
 @Get('trending') async trending(){return this.cached('discover:trending',async()=>(
  await this.db.query("SELECT p.id,p.name,p.price,p.stock,p.image,coalesce(sum(oi.quantity),0)::int purchases FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id WHERE p.active=true AND p.parent_product_id IS NULL GROUP BY p.id ORDER BY purchases DESC,p.id ASC LIMIT 12")
 ).rows);}
 @Get('recent') async recent(@Req() req:Request){
  const u=await this.auth.viewer(req);if(!u)return [];
  return (await this.db.query('SELECT DISTINCT ON (h.product_id) p.*,h.viewed_at FROM view_history h JOIN products p ON p.id=h.product_id WHERE h.user_id=$1 ORDER BY h.product_id,h.viewed_at DESC LIMIT 24',[u.id])).rows;
 }
 @Get('recommendations') async recommendations(@Req() req:Request){
  const u=await this.auth.viewer(req);if(!u)return this.trending();
  const result=await this.db.query(`WITH mine AS (
   SELECT DISTINCT oi.product_id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=$1
  ), similar AS (
   SELECT DISTINCT o.user_id FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.product_id IN (SELECT product_id FROM mine) AND o.user_id<>$1
  ), picks AS (
   SELECT oi.product_id,count(*)::int score FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id IN (SELECT user_id FROM similar) AND oi.product_id NOT IN (SELECT product_id FROM mine) GROUP BY oi.product_id
  ) SELECT p.id,p.name,p.price,p.stock,p.image,picks.score FROM picks JOIN products p ON p.id=picks.product_id WHERE p.active=true ORDER BY picks.score DESC LIMIT 12`,[u.id]);
  return result.rows.length?result.rows:this.trending();
 }
 @Get('search/facets') async facets(@Query('q') q:string){
  const term='%'+String(q||'').slice(0,80)+'%';
  return this.cached('facets:'+term,async()=>(await this.db.query('SELECT c.slug,c.name,count(p.id)::int count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.active=true AND p.name ILIKE $1 GROUP BY c.id ORDER BY c.name',[term])).rows);
 }
 @Get('variants/:id') async variants(@Param('id') id:string){
  return (await this.db.query('SELECT id,name,sku,variant_label,price,stock,image FROM products WHERE parent_product_id=$1 AND active=true ORDER BY id',[number(id)])).rows;
 }
}
