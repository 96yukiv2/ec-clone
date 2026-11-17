import {Injectable,BadRequestException} from '@nestjs/common';
import {Db} from '../../common/db';
@Injectable()
export class AdminRepository{
 constructor(private readonly db:Db){}
 async summary(){
  const [counts,lowStock,trend,ranking]=await Promise.all([
   this.db.query("SELECT count(*)::int orders,coalesce(sum(total) FILTER (WHERE status IN ('paid','shipped','delivered')),0)::bigint revenue FROM orders"),
   this.db.query('SELECT id,name,stock FROM products WHERE stock<=5 ORDER BY stock,id LIMIT 25'),
   this.db.query("SELECT date_trunc('day',created_at)::date day,sum(total)::bigint total FROM orders WHERE status IN ('paid','shipped','delivered') GROUP BY 1 ORDER BY 1 DESC LIMIT 30"),
   this.db.query('SELECT p.id,p.name,coalesce(sum(oi.quantity),0)::int sold FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id GROUP BY p.id ORDER BY sold DESC LIMIT 10')
  ]);
  return {orders:counts.rows[0],lowStock:lowStock.rows,trend:trend.rows,ranking:ranking.rows};
 }
 async orders(){return (await this.db.query('SELECT o.*,u.email FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 100')).rows;}
 async setStatus(orderId:number,from:string,status:string){return (await this.db.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 AND status=$3 RETURNING *',[status,orderId,from])).rows[0];}
 async createProduct(data:{name:string;slug:string;price:number;stock:number;description:string;categoryId:number|null;image:string;sku:string|null;parentProductId:number|null;variantLabel:string|null}){
  return (await this.db.query('INSERT INTO products(name,slug,price,stock,description,category_id,image,sku,parent_product_id,variant_label) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[data.name,data.slug,data.price,data.stock,data.description,data.categoryId,data.image,data.sku,data.parentProductId,data.variantLabel])).rows[0];
 }
 async updateProduct(productId:number,fields:Record<string,unknown>,actorId:number){
  const names:Record<string,string>={name:'name',description:'description',price:'price',stock:'stock',active:'active',image:'image',categoryId:'category_id',sku:'sku',parentProductId:'parent_product_id',variantLabel:'variant_label'};
  const entries=Object.entries(fields).filter(([key])=>Boolean(names[key]));
  if(!entries.length)throw new BadRequestException('更新項目がありません');
  return this.db.transaction(async tx=>{
   const previous=(await tx.query('SELECT price FROM products WHERE id=$1 FOR UPDATE',[productId])).rows[0];
   if(!previous)throw new BadRequestException('商品が見つかりません');
   const setters=entries.map(([key],i)=>names[key]+'=$'+(i+1)).join(',');
   const updated=(await tx.query('UPDATE products SET '+setters+' WHERE id=$'+(entries.length+1)+' RETURNING *',[...entries.map(e=>e[1]),productId])).rows[0];
   if(previous.price!==updated.price)await tx.query('INSERT INTO price_history(product_id,price) VALUES($1,$2)',[productId,updated.price]);
   await tx.query('INSERT INTO audit_logs(actor_id,action,details) VALUES($1,$2,$3)',[actorId,'product.update',JSON.stringify({productId,fields:entries.map(e=>e[0])})]);
   return updated;
  });
 }
 async record(actorId:number,action:string,details:unknown){await this.db.query('INSERT INTO audit_logs(actor_id,action,details) VALUES($1,$2,$3)',[actorId,action,JSON.stringify(details)]);}
 async audit(){return (await this.db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')).rows;}
 async prices(id:number){return (await this.db.query('SELECT price,created_at FROM price_history WHERE product_id=$1 ORDER BY created_at DESC LIMIT 100',[id])).rows;}
}