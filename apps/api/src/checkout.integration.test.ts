import 'reflect-metadata';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {NestFactory} from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {AppModule} from './app';
import {Db} from './db';
describe('在庫・決済の結合テスト',()=>{
 let app:INestApplication;
 let db:Db;
 const suffix=Date.now().toString(36);
 const productSlug='concurrency-test-'+suffix;
 let productId:number;
 async function createUser(part:string){
  const email='integration-'+part+'-'+suffix+'@example.test';
  const response=await request(app.getHttpServer()).post('/auth/register').send({name:'テスト',email,password:'safe-local-password-123'});
  expect(response.status).toBe(201);
  const cookie=response.headers['set-cookie']?.[0]?.split(';')[0] as string;
  expect(cookie).toMatch(/^session=/);
  return {cookie,userId:response.body.id,email};
 }
 beforeAll(async()=>{
  if(!process.env.DATABASE_URL?.includes('ec_test'))throw new Error('専用テストDBが必要です');
  app=await NestFactory.create(AppModule,{logger:false});
  app.use(cookieParser());
  await app.init();
  db=app.get(Db);
  const p=await db.query('INSERT INTO products(name,slug,description,price,stock) VALUES($1,$2,$3,$4,$5) RETURNING id',['在庫競合テスト',productSlug,'結合テスト',2000,1]);
  productId=p.rows[0].id;
 },30000);
 afterAll(async()=>{await app?.close();});
 it('二人が在庫1個を同時購入しても片方しか購入できない',async()=>{
  const [a,b]=await Promise.all([createUser('a'),createUser('b')]);
  const add=async (cookie:string)=>request(app.getHttpServer()).put('/cart/'+productId).set('Cookie',cookie).send({quantity:1});
  const [addedA,addedB]=await Promise.all([add(a.cookie),add(b.cookie)]);
  expect(addedA.status).toBe(200);expect(addedB.status).toBe(200);
  const checkout=(cookie:string,key:string)=>request(app.getHttpServer()).post('/orders').set('Cookie',cookie).send({idempotencyKey:key});
  const [first,second]=await Promise.all([checkout(a.cookie,'concurrent-a-'+suffix),checkout(b.cookie,'concurrent-b-'+suffix)]);
  expect([first.status,second.status].sort()).toEqual([201,409]);
  const stock=await db.query('SELECT stock FROM products WHERE id=$1',[productId]);
  expect(stock.rows[0].stock).toBe(0);
  const successful=first.status===201?{cookie:a.cookie,order:first.body}:{cookie:b.cookie,order:second.body};
  const cancel=await request(app.getHttpServer()).post('/orders/'+successful.order.id+'/cancel').set('Cookie',successful.cookie);
  expect(cancel.status).toBe(201);
  const after=await db.query('SELECT stock FROM products WHERE id=$1',[productId]);
  expect(after.rows[0].stock).toBe(1);
  const repeatedCancel=await request(app.getHttpServer()).post('/orders/'+successful.order.id+'/cancel').set('Cookie',successful.cookie);
  expect(repeatedCancel.status).toBe(201);
  const afterRetry=await db.query('SELECT stock FROM products WHERE id=$1',[productId]);
  expect(afterRetry.rows[0].stock).toBe(1);
 });
 it('Mock Webhookの重複受信で通知を二重登録しない',async()=>{
  const a=await createUser('webhook');
  await db.query("UPDATE users SET role='admin' WHERE id=$1",[a.userId]);
  await request(app.getHttpServer()).put('/cart/'+productId).set('Cookie',a.cookie).send({quantity:1});
  const placed=await request(app.getHttpServer()).post('/orders').set('Cookie',a.cookie).send({idempotencyKey:'webhook-order-'+suffix});
  expect(placed.status).toBe(201);
  const payload={eventId:'event-'+suffix+'-1',orderId:placed.body.id,outcome:'paid'};
  const first=await request(app.getHttpServer()).post('/mock-webhooks/payment').set('Cookie',a.cookie).send(payload);
  const second=await request(app.getHttpServer()).post('/mock-webhooks/payment').set('Cookie',a.cookie).send(payload);
  expect(first.status).toBe(201);expect(first.body.duplicate).toBe(false);
  expect(second.status).toBe(201);expect(second.body.duplicate).toBe(true);
  const events=await db.query("SELECT count(*)::int total FROM outbox WHERE event_type='order.paid' AND (payload->>'orderId')::int=$1",[placed.body.id]);
  expect(events.rows[0].total).toBe(1);
 });
});
