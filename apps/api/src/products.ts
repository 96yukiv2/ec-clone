import { Controller, Get, Post, Param, Query, Req, Body, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Db } from './db';
import { Auth } from './auth';
const num=(v:any, fallback=0)=> {const n=Number(v);return Number.isFinite(n)?Math.trunc(n):fallback};
@Controller('products')
export class ProductsController {
  constructor(private db: Db, private auth: Auth) {}
  @Get()
  async list(@Query() q:any) {
    const values:any[]=[]; const where=['p.active=true','p.parent_product_id IS NULL'];
    if(q.search){values.push('%'+String(q.search).slice(0,100).replace(/[\\%_]/g,'\\if(q.search){values.push('%'+String(q.search).slice(0,100)+'%');')+'%');where.push('(p.name ILIKE $'+values.length+' OR p.description ILIKE $'+values.length+')');}
    if(q.category){values.push(String(q.category));where.push('c.slug=$'+values.length);}
    if(q.minPrice!==undefined){values.push(Math.max(0,num(q.minPrice)));where.push('p.price >= $'+values.length);}
    if(q.maxPrice!==undefined){values.push(Math.max(0,num(q.maxPrice)));where.push('p.price <= $'+values.length);}
    if(q.inStock==='true') where.push('p.stock>0');
    if(q.minRating!==undefined){values.push(Math.max(0,Math.min(5,num(q.minRating))));where.push('coalesce(r.rating,0) >= 
    const sort:any={newest:'p.created_at DESC',price_asc:'p.price ASC',price_desc:'p.price DESC',popular:'sales DESC',rating:'rating DESC'};
    const order=sort[q.sort]||sort.newest, page=Math.max(1,num(q.page,1)), limit=Math.min(48,Math.max(1,num(q.limit,12)));
    const base=' FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN (SELECT product_id,coalesce(avg(rating),0)::float rating,count(*) reviews FROM reviews GROUP BY product_id) r ON r.product_id=p.id LEFT JOIN (SELECT product_id,sum(quantity)::int sales FROM order_items GROUP BY product_id) s ON s.product_id=p.id WHERE '+where.join(' AND ');
    const count=await this.db.query('SELECT count(*)::int count'+base,values);
    const rows=await this.db.query('SELECT p.*,c.name category,c.slug category_slug,coalesce(r.rating,0) rating,coalesce(r.reviews,0)::int reviews,coalesce(s.sales,0)::int sales'+base+' ORDER BY '+order+',p.id DESC LIMIT $'+(values.length+1)+' OFFSET $'+(values.length+2),[...values,limit,(page-1)*limit]);
    return {items:rows.rows,total:count.rows[0].count,page,limit};
  }
  @Get('suggest') async suggest(@Query('q') q:string) {
    if(!q?.trim()) return [];
    const r=await this.db.query('SELECT id,name,slug FROM products WHERE active=true AND name ILIKE $1 ORDER BY name LIMIT 8',['%'+q.slice(0,60)+'%']);return r.rows;
  }
  @Get('categories') async categories(){ return (await this.db.query('SELECT * FROM categories ORDER BY name')).rows; }
  @Get(':id/reviews')
  async reviews(@Param('id') id:string){return (await this.db.query('SELECT r.id,r.rating,r.body,r.created_at,u.name, (SELECT count(*)::int FROM review_votes v WHERE v.review_id=r.id) helpful FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.product_id=$1 ORDER BY r.created_at DESC',[num(id)])).rows;}
  @Get(':id/related') async related(@Param('id') id:string) {
    return (await this.db.query('SELECT p.* FROM products p WHERE p.category_id=(SELECT category_id FROM products WHERE id=$1) AND p.id<>$1 AND p.active=true ORDER BY random() LIMIT 6',[num(id)])).rows;
  }
  @Get(':id')
  async detail(@Param('id') id:string,@Req() req:Request) {
    const r=await this.db.query('SELECT p.*,c.name category FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=$1 AND p.active=true',[num(id)]);
    if(!r.rows.length) throw new BadRequestException('Product not found');
    const viewer=await this.auth.viewer(req);
    if(viewer) await this.db.query('INSERT INTO view_history(user_id,product_id) VALUES($1,$2)',[viewer.id,num(id)]);
    return r.rows[0];
  }
  @Post(':id/reviews')
  async review(@Param('id') id:string,@Req() req:Request,@Body() b:any){
    const user=await this.auth.required(req); const rating=num(b?.rating),body=String(b?.body||'').trim();
    if(rating<1||rating>5||body.length<3||body.length>1000)throw new BadRequestException('Invalid rating or body');
    const bought=await this.db.query("SELECT 1 FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=$1 AND oi.product_id=$2 AND o.status IN ('paid','shipped','delivered') LIMIT 1",[user.id,num(id)]);
    if(!bought.rowCount)throw new BadRequestException('Only purchasers can review');
    await this.db.query('INSERT INTO reviews(user_id,product_id,rating,body) VALUES($1,$2,$3,$4) ON CONFLICT (user_id,product_id) DO UPDATE SET rating=excluded.rating,body=excluded.body',[user.id,num(id),rating,body]);return {ok:true};
  }
  @Post('reviews/:reviewId/helpful')
  async helpful(@Param('reviewId') reviewId:string,@Req() req:Request){
    const user=await this.auth.required(req);
    await this.db.query('INSERT INTO review_votes(user_id,review_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[user.id,num(reviewId)]);return {ok:true};
  }
}
+values.length);}
    const sort:any={newest:'p.created_at DESC',price_asc:'p.price ASC',price_desc:'p.price DESC',popular:'sales DESC',rating:'rating DESC'};
    const order=sort[q.sort]||sort.newest, page=Math.max(1,num(q.page,1)), limit=Math.min(48,Math.max(1,num(q.limit,12)));
    const base=' FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN (SELECT product_id,coalesce(avg(rating),0)::float rating,count(*) reviews FROM reviews GROUP BY product_id) r ON r.product_id=p.id LEFT JOIN (SELECT product_id,sum(quantity)::int sales FROM order_items GROUP BY product_id) s ON s.product_id=p.id WHERE '+where.join(' AND ');
    const count=await this.db.query('SELECT count(*)::int count'+base,values);
    const rows=await this.db.query('SELECT p.*,c.name category,c.slug category_slug,coalesce(r.rating,0) rating,coalesce(r.reviews,0)::int reviews,coalesce(s.sales,0)::int sales'+base+' ORDER BY '+order+',p.id DESC LIMIT $'+(values.length+1)+' OFFSET $'+(values.length+2),[...values,limit,(page-1)*limit]);
    return {items:rows.rows,total:count.rows[0].count,page,limit};
  }
  @Get('suggest') async suggest(@Query('q') q:string) {
    if(!q?.trim()) return [];
    const r=await this.db.query('SELECT id,name,slug FROM products WHERE active=true AND name ILIKE $1 ORDER BY name LIMIT 8',['%'+q.slice(0,60)+'%']);return r.rows;
  }
  @Get('categories') async categories(){ return (await this.db.query('SELECT * FROM categories ORDER BY name')).rows; }
  @Get(':id/reviews')
  async reviews(@Param('id') id:string){return (await this.db.query('SELECT r.id,r.rating,r.body,r.created_at,u.name, (SELECT count(*)::int FROM review_votes v WHERE v.review_id=r.id) helpful FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.product_id=$1 ORDER BY r.created_at DESC',[num(id)])).rows;}
  @Get(':id/related') async related(@Param('id') id:string) {
    return (await this.db.query('SELECT p.* FROM products p WHERE p.category_id=(SELECT category_id FROM products WHERE id=$1) AND p.id<>$1 AND p.active=true ORDER BY random() LIMIT 6',[num(id)])).rows;
  }
  @Get(':id')
  async detail(@Param('id') id:string,@Req() req:Request) {
    const r=await this.db.query('SELECT p.*,c.name category FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=$1 AND p.active=true',[num(id)]);
    if(!r.rows.length) throw new BadRequestException('Product not found');
    const viewer=await this.auth.viewer(req);
    if(viewer) await this.db.query('INSERT INTO view_history(user_id,product_id) VALUES($1,$2)',[viewer.id,num(id)]);
    return r.rows[0];
  }
  @Post(':id/reviews')
  async review(@Param('id') id:string,@Req() req:Request,@Body() b:any){
    const user=await this.auth.required(req); const rating=num(b?.rating),body=String(b?.body||'').trim();
    if(rating<1||rating>5||body.length<3||body.length>1000)throw new BadRequestException('Invalid rating or body');
    const bought=await this.db.query("SELECT 1 FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=$1 AND oi.product_id=$2 AND o.status IN ('paid','shipped','delivered') LIMIT 1",[user.id,num(id)]);
    if(!bought.rowCount)throw new BadRequestException('Only purchasers can review');
    await this.db.query('INSERT INTO reviews(user_id,product_id,rating,body) VALUES($1,$2,$3,$4) ON CONFLICT (user_id,product_id) DO UPDATE SET rating=excluded.rating,body=excluded.body',[user.id,num(id),rating,body]);return {ok:true};
  }
  @Post('reviews/:reviewId/helpful')
  async helpful(@Param('reviewId') reviewId:string,@Req() req:Request){
    const user=await this.auth.required(req);
    await this.db.query('INSERT INTO review_votes(user_id,review_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[user.id,num(reviewId)]);return {ok:true};
  }
}
