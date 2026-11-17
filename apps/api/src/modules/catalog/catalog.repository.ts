import {Inject} from '@nestjs/common';
import {Injectable} from '@nestjs/common';
import {Db} from '../../common/db';

const integer=(value:unknown,fallback:number)=>{const n=Number(value);return Number.isSafeInteger(n)?n:fallback;};
@Injectable()
export class CatalogRepository {
 constructor(@Inject(Db) private readonly db:Db){}
 async search(query:Record<string,unknown>){
  const args:unknown[]=[];const where=['p.active=true','p.parent_product_id IS NULL'];
  const add=(value:unknown)=>{args.push(value);return '$'+args.length;};
  if(query.search) {
   const param=add('%'+String(query.search).slice(0,100)+'%');
   where.push('(p.name ILIKE '+param+' OR p.description ILIKE '+param+')');
  }
  if(query.category)where.push('c.slug='+add(String(query.category)));
  if(query.minPrice!==undefined)where.push('p.price>='+add(Math.max(0,integer(query.minPrice,0))));
  if(query.maxPrice!==undefined)where.push('p.price<='+add(Math.max(0,integer(query.maxPrice,0))));
  if(query.inStock==='true')where.push('p.stock>0');
  if(query.minRating!==undefined)where.push('coalesce(r.rating,0)>='+add(Math.min(5,Math.max(0,Number(query.minRating)||0))));
  const orders:Record<string,string>={newest:'p.created_at DESC',price_asc:'p.price ASC',price_desc:'p.price DESC',popular:'sales DESC',rating:'rating DESC'};
  const sort=orders[String(query.sort)]||orders.newest;
  const page=Math.max(1,integer(query.page,1)),limit=Math.min(48,Math.max(1,integer(query.limit,12)));
  const base=" FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN (SELECT product_id,coalesce(avg(rating),0)::float rating,count(*) reviews FROM reviews GROUP BY product_id) r ON r.product_id=p.id LEFT JOIN (SELECT product_id,sum(quantity)::int sales FROM order_items GROUP BY product_id) s ON s.product_id=p.id WHERE "+where.join(' AND ');
  const count=await this.db.query('SELECT count(*)::int count'+base,args);
  const rows=await this.db.query('SELECT p.*,c.name category,c.slug category_slug,coalesce(r.rating,0) rating,coalesce(r.reviews,0)::int reviews,coalesce(s.sales,0)::int sales'+base+' ORDER BY '+sort+',p.id DESC LIMIT $'+(args.length+1)+' OFFSET $'+(args.length+2),[...args,limit,(page-1)*limit]);
  return {items:rows.rows,total:count.rows[0].count,page,limit};
 }
 async suggest(q:string){return (await this.db.query('SELECT id,name,slug FROM products WHERE active=true AND name ILIKE $1 ORDER BY name LIMIT 8',['%'+q.slice(0,60)+'%'])).rows;}
 async categories(){return (await this.db.query('SELECT * FROM categories ORDER BY name')).rows;}
 async reviews(id:number){return (await this.db.query('SELECT r.id,r.rating,r.body,r.created_at,u.name,(SELECT count(*)::int FROM review_votes v WHERE v.review_id=r.id) helpful FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.product_id=$1 ORDER BY r.created_at DESC',[id])).rows;}
 async related(id:number){return (await this.db.query('SELECT p.* FROM products p WHERE p.category_id=(SELECT category_id FROM products WHERE id=$1) AND p.id<>$1 AND p.active=true ORDER BY random() LIMIT 6',[id])).rows;}
 async detail(id:number){return (await this.db.query('SELECT p.*,c.name category FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=$1 AND p.active=true',[id])).rows[0];}
 async recordView(userId:number,productId:number){await this.db.query('INSERT INTO view_history(user_id,product_id) VALUES($1,$2)',[userId,productId]);}
 async hasPurchased(userId:number,productId:number){return Boolean((await this.db.query("SELECT 1 FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=$1 AND oi.product_id=$2 AND o.status IN ('paid','shipped','delivered') LIMIT 1",[userId,productId])).rowCount);}
 async saveReview(userId:number,productId:number,rating:number,body:string){
  await this.db.query('INSERT INTO reviews(user_id,product_id,rating,body) VALUES($1,$2,$3,$4) ON CONFLICT (user_id,product_id) DO UPDATE SET rating=excluded.rating,body=excluded.body',[userId,productId,rating,body]);
 }
 async helpful(userId:number,reviewId:number){await this.db.query('INSERT INTO review_votes(user_id,review_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[userId,reviewId]);}
}
