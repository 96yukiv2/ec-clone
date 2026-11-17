import {Injectable,BadRequestException,ConflictException} from '@nestjs/common';
import {OrdersRepository} from './orders.repository';
import {int,money} from '../../common/validation';
@Injectable()
export class OrdersService {
 constructor(private readonly repository:OrdersRepository){}
 cart(userId:number){return this.repository.cart(userId);}
 async setCart(userId:number,productId:unknown,quantity:unknown){
  const pid=int(productId,1),qty=int(quantity,0,99);
  if(!qty)await this.repository.removeItem(userId,pid);
  else{
   if(!await this.repository.productExists(pid))throw new BadRequestException('商品が見つかりません');
   await this.repository.putItem(userId,pid,qty);
  }
  return this.repository.cart(userId);
 }
 list(userId:number){return this.repository.orders(userId);}
 async detail(userId:number,orderId:unknown){
  const oid=int(orderId,1),order=await this.repository.detail(userId,oid);
  if(!order)throw new BadRequestException('注文が見つかりません');
  return {...order,items:await this.repository.detailItems(oid)};
 }
 async checkout(userId:number,body:any){
  const key=String(body?.idempotencyKey||'').trim();
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))throw new BadRequestException('冪等性キーが不正です');
  const coupon=String(body?.couponCode||'').trim().toUpperCase();
  const addressId=body?.addressId?int(body.addressId,1):null;
  return this.repository.transaction(async tx=>{
   await tx.lockKey(userId+':'+key);
   const old=await tx.findByKey(userId,key);
   if(old)return old;
   const cart=await tx.lockCart(userId);
   if(!cart.length)throw new BadRequestException('カートが空です');
   if(cart.some(item=>item.quantity<1||item.quantity>item.stock))throw new ConflictException('在庫不足です');
   let percent=0;
   if(coupon){
    const value=await tx.discountPercent(coupon);
    if(value===undefined)throw new BadRequestException('クーポンが無効です');
    percent=value;
   }
   let address=null;
   if(addressId){
    address=await tx.address(userId,addressId);
    if(!address)throw new BadRequestException('配送先が見つかりません');
   }
   const subtotal=cart.reduce((n,item)=>n+item.price*item.quantity,0);
   const totals=money(subtotal,percent);
   const order=await tx.createOrder(userId,{subtotal,...totals,coupon,address,key});
   for(const item of cart)await tx.reserve(order.id,item);
   await tx.emptyCart(userId);
   return order;
  });
 }
 async pay(userId:number,id:unknown,succeed:boolean){
  const orderId=int(id,1);
  return this.repository.transaction(async tx=>{
   const old=await tx.lockOrder(orderId,userId);
   if(!old)throw new BadRequestException('注文が見つかりません');
   if(old.status==='paid'&&succeed)return old;
   if(!['pending_payment','payment_failed'].includes(old.status))throw new ConflictException('決済できない注文状態です');
   const status=succeed?'paid':'payment_failed';
   const result=await tx.status(orderId,status);
   if(succeed)await tx.event('order.paid',orderId);
   return result;
  });
 }
 async cancel(userId:number,id:unknown){
  const orderId=int(id,1);
  return this.repository.transaction(async tx=>{
   const order=await tx.lockOrder(orderId,userId);
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(order.status==='cancelled')return order;
   if(!['pending_payment','payment_failed','paid'].includes(order.status))throw new ConflictException('この注文はキャンセルできません');
   await tx.restore(await tx.items(orderId));
   return tx.status(orderId,'cancelled');
  });
 }
 async refund(userId:number,id:unknown){
  const orderId=int(id,1);
  return this.repository.transaction(async tx=>{
   const order=await tx.lockOrder(orderId,userId);
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(order.status==='refunded')return order;
   if(!['paid','delivered'].includes(order.status))throw new ConflictException('返金できない注文状態です');
   if(order.status==='paid')await tx.restore(await tx.items(orderId));
   const updated=await tx.status(orderId,'refunded');
   await tx.event('order.refunded',orderId);
   return updated;
  });
 }
 async webhook(eventId:string,orderId:number,outcome:'paid'|'payment_failed'){
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(eventId))throw new BadRequestException('イベントIDが不正です');
  return this.repository.transaction(async tx=>{
   if(await tx.hasPaymentEvent(eventId))return {duplicate:true};
   const order=await tx.lockOrder(orderId);
   if(!order)throw new BadRequestException('注文が見つかりません');
   if(!['pending_payment','payment_failed'].includes(order.status))throw new ConflictException('決済処理は完了済みです');
   await tx.paymentEvent(eventId,orderId,outcome);
   await tx.status(orderId,outcome);
   if(outcome==='paid')await tx.event('order.paid',orderId);
   return {duplicate:false,status:outcome};
  });
 }
}
