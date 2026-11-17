import {Inject} from '@nestjs/common';
import {Injectable,BadRequestException,ForbiddenException} from '@nestjs/common';
import {Request,Response} from 'express';
import {createHash,randomBytes} from 'node:crypto';
import {int,str} from '../../common/validation';
import {GuestRepository} from './guest.repository';
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
@Injectable()
export class GuestService{
 constructor(@Inject(GuestRepository) private readonly repository:GuestRepository){}
 async checkout(body:any,req:Request,res:Response){
  const email=str(body?.email,3,200).toLowerCase();
  if(!/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(email))throw new BadRequestException('メールアドレスが不正です');
  if(!Array.isArray(body?.items)||body.items.length<1||body.items.length>30)throw new BadRequestException('カートが不正です');
  const items=new Map<number,number>();
  for(const entry of body.items){
   const productId=int(entry.productId,1),quantity=int(entry.quantity,1,99);
   items.set(productId,(items.get(productId)||0)+quantity);
  }
  if([...items.values()].some(quantity=>quantity>99))throw new BadRequestException('数量が多すぎます');
  const key=str(body?.idempotencyKey,8,100);
  if(!/^[a-zA-Z0-9_-]+$/.test(key))throw new BadRequestException('冪等性キーが不正です');
  let token=req.cookies?.guest_token;
  if(typeof token!=='string'||token.length<16){
   token=randomBytes(32).toString('hex');
   res.cookie('guest_token',token,{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:86400_000});
  }
  return this.repository.checkout({hash:digest(token),email,key,items,coupon:String(body?.couponCode||'').trim().toUpperCase(),address:body?.shippingAddress||null});
 }
 async orders(req:Request){
  const token=req.cookies?.guest_token;
  return typeof token==='string'?this.repository.orders(digest(token)):[];
 }
 async pay(req:Request,id:string,body:any){
  const token=req.cookies?.guest_token;
  if(typeof token!=='string')throw new ForbiddenException('ゲスト注文Cookieがありません');
  return this.repository.pay(digest(token),int(id,1),body?.succeed===true);
 }
}
