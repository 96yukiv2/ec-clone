import 'reflect-metadata';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {NestFactory} from '@nestjs/core';
import type {INestApplication} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import {AppModule} from '../app';
import {Db} from '../common/db';

describe('会員・商品検索・管理APIの結合テスト',()=>{
 let app:INestApplication,db:Db,cookie:string,userId:number,createdProduct:number;
 const suffix=Date.now().toString(36);
 const email='account-'+suffix+'@example.test';
 beforeAll(async()=>{
  if(!process.env.DATABASE_URL?.includes('ec_test'))throw new Error('専用テストDBのみ使用できます');
  app=await NestFactory.create(AppModule,{logger:false});
  app.use(cookieParser());
  await app.init();
  db=app.get(Db);
  const registered=await request(app.getHttpServer()).post('/auth/register').send({name:'統合テスト会員',email,password:'secure-test-password-123'});
  expect(registered.status).toBe(201);
  userId=registered.body.id;
  cookie=registered.headers['set-cookie']?.[0]?.split(';')[0];
 });
 afterAll(async()=>{await app?.close();});
 it('会員セッション取得とログインを行える',async()=>{
  const me=await request(app.getHttpServer()).get('/auth/me').set('Cookie',cookie);
  expect(me.status).toBe(200);expect(me.body.email).toBe(email);
  const invalid=await request(app.getHttpServer()).post('/auth/login').send({email,password:'wrong-password'});
  expect(invalid.status).toBe(401);
  const login=await request(app.getHttpServer()).post('/auth/login').send({email,password:'secure-test-password-123'});
  expect(login.status).toBe(201);
  expect(login.headers['set-cookie']?.[0]).toContain('session=');
 });
 it('お気に入りと配送先のCRUDを行える',async()=>{
  const p=(await db.query('SELECT id FROM products WHERE active=true LIMIT 1')).rows[0];
  const added=await request(app.getHttpServer()).post('/account/favorites/'+p.id).set('Cookie',cookie);
  expect(added.status).toBe(201);
  const favorites=await request(app.getHttpServer()).get('/account/favorites').set('Cookie',cookie);
  expect(favorites.body.some((x:any)=>x.id===p.id)).toBe(true);
  const removed=await request(app.getHttpServer()).delete('/account/favorites/'+p.id).set('Cookie',cookie);
  expect(removed.status).toBe(200);
  const address=await request(app.getHttpServer()).post('/account/addresses').set('Cookie',cookie).send({postalCode:'1234567',region:'東京都',city:'千代田区',line1:'テスト1-1'});
  expect(address.status).toBe(201);
  const list=await request(app.getHttpServer()).get('/account/addresses').set('Cookie',cookie);
  expect(list.body.some((x:any)=>x.id===address.body.id)).toBe(true);
  const del=await request(app.getHttpServer()).delete('/account/addresses/'+address.body.id).set('Cookie',cookie);
  expect(del.status).toBe(200);
 });
 it('商品検索・候補・カテゴリ・関連商品が利用できる',async()=>{
  const search=await request(app.getHttpServer()).get('/products').query({search:'Book',minPrice:0,maxPrice:100000,inStock:'true',sort:'price_asc'});
  expect(search.status).toBe(200);
  expect(Array.isArray(search.body.items)).toBe(true);
  const suggest=await request(app.getHttpServer()).get('/products/suggest?q=Book');
  expect(suggest.status).toBe(200);
  const categories=await request(app.getHttpServer()).get('/products/categories');
  expect(categories.status).toBe(200);
  expect(categories.body.length).toBeGreaterThan(0);
  const trending=await request(app.getHttpServer()).get('/discovery/trending');
  expect(trending.status).toBe(200);
  const recommendation=await request(app.getHttpServer()).get('/discovery/recommendations').set('Cookie',cookie);
  expect(recommendation.status).toBe(200);
 });
 it('権限のない会員は商品登録できない',async()=>{
  const unauthorized=await request(app.getHttpServer()).post('/admin/products').set('Cookie',cookie).send({name:'不可',slug:'forbidden-'+suffix,price:1000,stock:1});
  expect(unauthorized.status).toBe(401);
 });
 it('管理者昇格後の商品管理・監査・売上APIを検証する',async()=>{
  await db.query("UPDATE users SET role='admin' WHERE id=$1",[userId]);
  const created=await request(app.getHttpServer()).post('/admin/products').set('Cookie',cookie).send({name:'管理画面テスト',slug:'admin-'+suffix,price:2200,stock:5});
  expect(created.status).toBe(201);createdProduct=created.body.id;
  const update=await request(app.getHttpServer()).patch('/admin/products/'+createdProduct).set('Cookie',cookie).send({price:2300,stock:7});
  expect(update.status).toBe(200);
  expect(update.body.price).toBe(2300);
  const prices=await request(app.getHttpServer()).get('/admin/products/'+createdProduct+'/prices').set('Cookie',cookie);
  expect(prices.status).toBe(200);expect(prices.body.some((p:any)=>p.price===2300)).toBe(true);
  const summary=await request(app.getHttpServer()).get('/admin/summary').set('Cookie',cookie);
  expect(summary.status).toBe(200);expect(summary.body.orders).toBeDefined();
  const audit=await request(app.getHttpServer()).get('/admin/audit').set('Cookie',cookie);
  expect(audit.status).toBe(200);expect(audit.body.some((e:any)=>e.action==='product.update')).toBe(true);
  const jobs=await request(app.getHttpServer()).get('/admin/jobs').set('Cookie',cookie);
  expect(jobs.status).toBe(200);
 });
});
