import {Inject} from '@nestjs/common';
import {Injectable,BadRequestException,ConflictException} from '@nestjs/common';
import {Request} from 'express';
import {Auth} from '../auth/auth';
import {CacheService} from '../../common/cache';
import {AdminRepository} from './admin.repository';
import {int,str} from '../../common/validation';
@Injectable()
export class AdminService{
 constructor(@Inject(Auth) private readonly auth:Auth,@Inject(AdminRepository) private readonly repository:AdminRepository,@Inject(CacheService) private readonly cache:CacheService){}
 async summary(req:Request){await this.auth.required(req,true);return this.repository.summary();}
 async orders(req:Request){await this.auth.required(req,true);return this.repository.orders();}
 async status(req:Request,id:string,b:any){
  const user=await this.auth.required(req,true),status=str(b?.status);
  if(!['shipped','delivered'].includes(status))throw new BadRequestException('注文状態が不正です');
  const order=await this.repository.setStatus(int(id,1),status==='shipped'?'paid':'shipped',status);
  if(!order)throw new ConflictException('状態遷移できません');
  await this.repository.record(user.id,'order.status',{orderId:order.id,status});
  return order;
 }
 async create(req:Request,b:any){
  const user=await this.auth.required(req,true);
  const name=str(b?.name,1,150),slug=str(b?.slug,2,100),price=int(b?.price,0),stock=int(b?.stock,0);
  if(!/^[a-z0-9-]+$/.test(slug))throw new BadRequestException('slugが不正です');
  const created=await this.repository.createProduct({name,slug,price,stock,description:String(b.description||''),categoryId:b.categoryId?int(b.categoryId,1):null,image:String(b.image||''),sku:b.sku?str(b.sku,1,100):null,parentProductId:b.parentProductId?int(b.parentProductId,1):null,variantLabel:b.variantLabel?str(b.variantLabel,1,100):null});
  await this.repository.record(user.id,'product.create',{productId:created.id});
  await this.cache.invalidate('discover:');await this.cache.invalidate('facets:');
  return created;
 }
 async update(req:Request,id:string,b:any){
  const user=await this.auth.required(req,true),fields:Record<string,unknown>={};
  for(const key of ['name','description','price','stock','active','image','categoryId','sku','parentProductId','variantLabel'])if(Object.prototype.hasOwnProperty.call(b||{},key))fields[key]=b[key];
  for(const k of ['price','stock'])if(k in fields)fields[k]=int(fields[k],0);
  if('active' in fields && typeof fields.active!=='boolean')throw new BadRequestException('公開設定が不正です');
  if('name' in fields)fields.name=str(fields.name,1,150);
  const updated=await this.repository.updateProduct(int(id,1),fields,user.id);
  await this.cache.invalidate('discover:');await this.cache.invalidate('facets:');
  return updated;
 }
 async audit(req:Request){await this.auth.required(req,true);return this.repository.audit();}
 async prices(req:Request,id:string){await this.auth.required(req,true);return this.repository.prices(int(id,1));}
}