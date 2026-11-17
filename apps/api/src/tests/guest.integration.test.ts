import 'reflect-metadata';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {NestFactory} from '@nestjs/core';
import type {INestApplication} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import {AppModule} from '../app';
import {Db} from '../common/db';

describe('ゲスト注文・管理者認可の結合テスト',()=>{
 let app:INestApplication;
 let db:Db;
 let productId:number;
 const suffix=Date.now().toString(36);
 beforeAll(async()=>{
  if(!process.env.DATABASE_URL?.includes('ec_test'))throw new Error('テスト専用DBが必要です');
  app=await NestFactory.create(AppModule,{logger:false});
  app.use(cookieParser());
  await app.init();
  db=app.get(Db);
  const created=await db.query('INSERT INTO products(name,slug,description,price,stock) VALUES($1,$2,$3,$4,$5) RETURNING id',['ゲスト購入テスト','guest-test-'+suffix,'ゲストテスト',1000,2]);
  productId=created.rows[0].id;
 });
 afterAll(async()=>{await app?.close();});
 it('未認証の管理者API・画像アップロードを拒否する',async()=>{
  const admin=await request(app.getHttpServer()).get('/admin/summary');
  expect(admin.status).toBe(401);
  const upload=await request(app.getHttpServer()).post('/admin/media').attach('file',Buffer.from('fake'),'image.png');
  expect(upload.status).toBe(401);
 });
 it('ゲスト注文の再送は同じ注文を返し、Mock決済でイベントは一度だけ登録する',async()=>{
  const key='guest-test-key-'+suffix;
  const body={email:'guest-'+suffix+'@example.test',items:[{productId,quantity:1}],idempotencyKey:key};
  const created=await request(app.getHttpServer()).post('/guest/checkout').send(body);
  expect(created.status).toBe(201);
  expect(created.body.status).toBe('pending_payment');
  const cookie=created.headers['set-cookie']?.[0]?.split(';')[0];
  expect(cookie).toMatch(/^guest_token=/);
  const retry=await request(app.getHttpServer()).post('/guest/checkout').set('Cookie',cookie).send(body);
  expect(retry.status).toBe(201);
  expect(retry.body.id).toBe(created.body.id);
  const paid=await request(app.getHttpServer()).post('/guest/orders/'+created.body.id+'/pay').set('Cookie',cookie).send({succeed:true});
  expect(paid.status).toBe(201);
  expect(paid.body.status).toBe('paid');
  const double=await request(app.getHttpServer()).post('/guest/orders/'+created.body.id+'/pay').set('Cookie',cookie).send({succeed:true});
  expect(double.status).toBe(201);
  const count=await db.query("SELECT count(*)::int count FROM outbox WHERE event_type='order.paid' AND (payload->>'orderId')::int=$1",[created.body.id]);
  expect(count.rows[0].count).toBe(1);
 });
 it('別ブラウザのゲストCookieでは注文情報を閲覧できない',async()=>{
  const response=await request(app.getHttpServer()).get('/guest/orders');
  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
 });
});
