import {describe,it,expect,vi} from 'vitest';
import {OrdersService} from './orders.service';
import {BadRequestException,ConflictException} from '@nestjs/common';
import type {OrdersRepository} from './orders.repository';
const fake=()=>({
 cart:vi.fn().mockResolvedValue([{product_id:1,quantity:1}]),
 putItem:vi.fn().mockResolvedValue(undefined),
 removeItem:vi.fn().mockResolvedValue(undefined),
 productExists:vi.fn().mockResolvedValue(true),
 orders:vi.fn().mockResolvedValue([]),
 transaction:vi.fn(),
});
describe('OrdersService：注文ドメインの単体テスト',()=>{
 it('不正なカート数量を拒否する',async()=>{
  const repository=fake(),service=new OrdersService(repository as unknown as OrdersRepository);
  await expect(service.setCart(1,10,-2)).rejects.toBeInstanceOf(BadRequestException);
  expect(repository.putItem).not.toHaveBeenCalled();
 });
 it('有効なカート更新をRepositoryに委譲する',async()=>{
  const repository=fake(),service=new OrdersService(repository as unknown as OrdersRepository);
  const result=await service.setCart(5,3,2);
  expect(repository.putItem).toHaveBeenCalledWith(5,3,2);
  expect(result).toHaveLength(1);
 });
 it('注文作成には冪等性キーが必要',async()=>{
  const repository=fake(),service=new OrdersService(repository as unknown as OrdersRepository);
  await expect(service.checkout(1,{idempotencyKey:'invalid!'})).rejects.toBeInstanceOf(BadRequestException);
  expect(repository.transaction).not.toHaveBeenCalled();
 });
 it('支払い済み注文への同一Mock決済リトライは重複イベントを登録しない',async()=>{
  const repository=fake();
  const tx={lockOrder:vi.fn().mockResolvedValue({id:9,status:'paid'}),event:vi.fn(),status:vi.fn()};
  repository.transaction.mockImplementation((fn:any)=>fn(tx));
  const service=new OrdersService(repository as unknown as OrdersRepository);
  const result=await service.pay(1,9,true);
  expect(result.status).toBe('paid');
  expect(tx.event).not.toHaveBeenCalled();
  expect(tx.status).not.toHaveBeenCalled();
 });
 it('キャンセル済み注文は在庫を二重で戻さない',async()=>{
  const repository=fake();
  const tx={lockOrder:vi.fn().mockResolvedValue({id:8,status:'cancelled'}),items:vi.fn(),restore:vi.fn()};
  repository.transaction.mockImplementation((fn:any)=>fn(tx));
  const service=new OrdersService(repository as unknown as OrdersRepository);
  await service.cancel(1,8);
  expect(tx.items).not.toHaveBeenCalled();
  expect(tx.restore).not.toHaveBeenCalled();
 });
 it('発送済み注文のキャンセルを拒否する',async()=>{
  const repository=fake();
  const tx={lockOrder:vi.fn().mockResolvedValue({id:8,status:'shipped'}),restore:vi.fn()};
  repository.transaction.mockImplementation((fn:any)=>fn(tx));
  const service=new OrdersService(repository as unknown as OrdersRepository);
  await expect(service.cancel(1,8)).rejects.toBeInstanceOf(ConflictException);
  expect(tx.restore).not.toHaveBeenCalled();
 });
});
