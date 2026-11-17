import 'reflect-metadata';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {NestFactory} from '@nestjs/core';
import type {INestApplication} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import {AppModule} from '../app';
import {Db} from '../common/db';
describe('API結合テスト（専用PostgreSQL + Redis）',()=>{
 let app:INestApplication;
 let db:Db;
 let cookie:string;
 let productId:number;
 const email='test-'+Date.now()+'@example.test';
 beforeAll(async()=>{
  if(!process.env.DATABASE_URL?.includes('ec_test'))throw new Error('結合テストには専用のec_test DBを利用してください');
  app=await NestFactory.create(AppModule,{logger:false});
  app.use(cookieParser());
  await app.init();
  db=app.get(Db);
  const r=await db.query('SELECT id FROM products WHERE active=true AND stock>3 ORDER BY id LIMIT 1');
  if(!r.rowCount)throw new Error('テスト商品がありません。seedを実行してください');
  productId=r.rows[0].id;
 },30000);
 afterAll(async()=>{await app?.close();});
 it('商品一覧を取得できる',async()=>{
  const result=await request(app.getHttpServer()).get('/products');
  expect(result.status).toBe(200);expect(result.body.items.length).toBeGreaterThan(0);
 });
 it('新規会員を作成してセッションCookieを取得できる',async()=>{
  const result=await request(app.getHttpServer()).post('/auth/register').send({name:'テスト会員',email,password:'local-test-password-1234'});
  expect(result.status).toBe(201);
  cookie=result.headers['set-cookie']?.[0]?.split(';')[0]||'';
  expect(cookie).toMatch(/^session=/);
 });
 it('カート追加→注文→冪等リトライ→決済→レビューが成立する',async()=>{
  const cart=await request(app.getHttpServer()).put('/cart/'+productId).set('Cookie',cookie).send({quantity:1});
  expect(cart.status).toBe(200);
  const key='test-'+Date.now()+'-checkout';
  const order=await request(app.getHttpServer()).post('/orders').set('Cookie',cookie).send({idempotencyKey:key,couponCode:'WELCOME10'});
  expect(order.status).toBe(201);
  expect(order.body.status).toBe('pending_payment');
  const retry=await request(app.getHttpServer()).post('/orders').set('Cookie',cookie).send({idempotencyKey:key});
  expect(retry.body.id).toBe(order.body.id);
  const pay=await request(app.getHttpServer()).post('/orders/'+order.body.id+'/pay').set('Cookie',cookie).send({succeed:true});
  expect(pay.status).toBe(201);expect(pay.body.status).toBe('paid');
  const review=await request(app.getHttpServer()).post('/products/'+productId+'/reviews').set('Cookie',cookie).send({rating:5,body:'テストレビューです'});
  expect(review.status).toBe(201);
  const detail=await request(app.getHttpServer()).get('/orders/'+order.body.id).set('Cookie',cookie);
  expect(detail.body.items).toHaveLength(1);
 });
 it('未ログインでカートと管理画面にアクセスできない',async()=>{
  const cart=await request(app.getHttpServer()).get('/cart');expect(cart.status).toBe(401);
  const admin=await request(app.getHttpServer()).get('/admin/summary');expect(admin.status).toBe(401);
 });
});
